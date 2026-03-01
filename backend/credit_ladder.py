"""
Credit Contraction & Expansion Ladder for RiskSense AI.

Implements the graduated credit ladder from the framework:
- Contraction: triggered by specific S5/S8 thresholds and invoice patterns
- Expansion: triggered by sustained good behavior over time

Replaces flat band-based credit multipliers with surgical controls.
"""

from typing import Optional
from sqlalchemy.orm import Session
from models import Agency, InvoicePayment
from sqlalchemy import func
import datetime


# ─── Ladder States (ordered from most permissive to most restrictive) ───
LADDER_STATES = [
    'FULL',              # Full credit, no restrictions
    'SOFT_WATCH',        # S5 > 0.60 — analyst notified, no credit change
    'SURGICAL',          # S5 > 0.75 + S8 rising — refundable cap, booking cap
    'MODERATE_CONTRACT', # S5 > 0.85 + S8 > 0.40 — limit at 75%, approval needed
    'HARD_CONTRACT',     # Two late invoices + worsening trend — limit at 40%
    'FROZEN',            # Invoice missed + no contact — credit frozen
]

# Credit multiplier per state
CREDIT_MULTIPLIERS = {
    'FULL': 1.0,
    'SOFT_WATCH': 1.0,         # No credit change yet
    'SURGICAL': 1.0,            # Caps applied but total limit unchanged
    'MODERATE_CONTRACT': 0.75,  # Limit reduced to 75%
    'HARD_CONTRACT': 0.40,      # Limit reduced to 40%
    'FROZEN': 0.0,              # Credit frozen
}

# Human-readable descriptions per state
LADDER_DESCRIPTIONS = {
    'FULL': 'Full credit. No restrictions.',
    'SOFT_WATCH': 'Soft watch. Analyst notified. No credit change yet.',
    'SURGICAL': 'Surgical limits applied. Refundable cap: 30% of outstanding. Single booking cap: ₹75,000.',
    'MODERATE_CONTRACT': 'Moderate contraction. Total limit reduced to 75%. Bookings above ₹50,000 need approval.',
    'HARD_CONTRACT': 'Hard contraction. Total limit reduced to 40%. All bookings enter approval queue.',
    'FROZEN': 'Credit frozen. Legal hold initiated. Recovery process opened.',
}


def evaluate_contraction(
    s5: float,
    s8: float,
    s8_previous: Optional[float],
    late_invoice_count: int,
    missed_invoice: bool,
    current_state: str,
) -> str:
    """
    Evaluate which contraction rung applies based on framework thresholds.
    Returns the new ladder state.
    
    Contraction Ladder:
      S5 > 0.60                        → SOFT_WATCH
      S5 > 0.75 + S8 rising            → SURGICAL
      S5 > 0.85 + S8 > 0.40            → MODERATE_CONTRACT
      Two invoices late + worsening     → HARD_CONTRACT
      Invoice missed + no contact       → FROZEN
    """
    # Most severe first
    if missed_invoice:
        return 'FROZEN'
    
    if late_invoice_count >= 2 and s8 > 0.3:
        return 'HARD_CONTRACT'
    
    if s5 > 0.85 and s8 > 0.40:
        return 'MODERATE_CONTRACT'
    
    s8_rising = (s8_previous is not None and s8 > s8_previous + 0.05) or s8 > 0.3
    if s5 > 0.75 and s8_rising:
        return 'SURGICAL'
    
    if s5 > 0.60:
        return 'SOFT_WATCH'
    
    return current_state  # Don't auto-improve — expansion has its own rules


def evaluate_expansion(
    db: Session,
    agency: Agency,
    s8: float,
    trust_score: int,
    current_state: str,
) -> str:
    """
    Evaluate expansion conditions from the framework.
    Returns the new ladder state (may be less restrictive than current).
    
    Expansion Ladder:
      3 invoices paid early in a row   → remove single booking cap (SURGICAL → SOFT_WATCH)
      S8 < 0.10 for 30 days           → credit restored to 60% (→ MODERATE_CONTRACT or better)
      Trust Score > 70 for 60 days     → credit restored to 80% (→ SOFT_WATCH)
      Trust Score > 80 for 6 months    → full credit restored + 15% expansion eligible
    """
    if current_state == 'FULL':
        return 'FULL'  # Already at best state
    
    # Check for 3 consecutive early invoices
    recent_invoices = db.query(InvoicePayment).filter(
        InvoicePayment.agency_id == agency.id,
        InvoicePayment.paid_date.isnot(None),
    ).order_by(InvoicePayment.due_date.desc()).limit(3).all()
    
    consecutive_early = 0
    for inv in recent_invoices:
        if inv.days_late is not None and inv.days_late <= 0:
            consecutive_early += 1
        else:
            break
    
    # Trust Score > 80 for extended period → FULL
    if trust_score > 80 and current_state in ['SOFT_WATCH', 'SURGICAL']:
        return 'FULL'
    
    # Trust Score > 70 → SOFT_WATCH
    if trust_score > 70 and current_state in ['MODERATE_CONTRACT', 'HARD_CONTRACT']:
        return 'SOFT_WATCH'
    
    # S8 < 0.10 → at least MODERATE_CONTRACT (60% credit)
    if s8 < 0.10 and current_state in ['HARD_CONTRACT', 'FROZEN']:
        return 'MODERATE_CONTRACT'
    
    # 3 invoices paid early → step up one level
    if consecutive_early >= 3:
        state_index = LADDER_STATES.index(current_state)
        if state_index > 0:
            return LADDER_STATES[state_index - 1]
    
    return current_state  # No expansion condition met


def compute_ladder_state(
    db: Session,
    agency: Agency,
    s5: float,
    s8: float,
    s8_previous: Optional[float],
    trust_score: int,
) -> dict:
    """
    Full ladder evaluation: check contraction first, then expansion.
    Returns {
        'state': str,
        'credit_multiplier': float,
        'credit_action': str,
        'changed': bool,
    }
    """
    current_state = getattr(agency, 'credit_ladder_state', None) or 'FULL'
    
    # Count late invoices in the last 90 days
    ninety_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=90)
    late_invoice_count = db.query(InvoicePayment).filter(
        InvoicePayment.agency_id == agency.id,
        InvoicePayment.due_date >= ninety_days_ago,
        InvoicePayment.days_late > 3,
    ).count()
    
    # Check for missed invoices (due but not paid)
    missed_invoice = db.query(InvoicePayment).filter(
        InvoicePayment.agency_id == agency.id,
        InvoicePayment.due_date < datetime.datetime.utcnow() - datetime.timedelta(days=7),
        InvoicePayment.paid_date.is_(None),
    ).count() > 0
    
    # Step 1: Evaluate contraction
    contraction_state = evaluate_contraction(
        s5, s8, s8_previous, late_invoice_count, missed_invoice, current_state,
    )
    
    # Contraction can only make things worse (higher index = more restrictive)
    contraction_index = LADDER_STATES.index(contraction_state)
    current_index = LADDER_STATES.index(current_state)
    
    if contraction_index > current_index:
        new_state = contraction_state  # Got worse
    else:
        # Step 2: Evaluate expansion (only if not contracting further)
        new_state = evaluate_expansion(db, agency, s8, trust_score, current_state)
    
    # Step 3: Apply Probationary Ceiling for new agencies (< 30 days tenure)
    # This prevents 'burner' agencies from accessing full credit limits immediately
    platform_tenure_days = getattr(agency, 'platform_tenure_days', 0) or 0
    if platform_tenure_days < 30:
        probation_max = 'MODERATE_CONTRACT'
        if LADDER_STATES.index(new_state) < LADDER_STATES.index(probation_max):
            new_state = probation_max
            return {
                'state': new_state,
                'credit_multiplier': CREDIT_MULTIPLIERS[new_state],
                'credit_action': f'PROBATIONARY PHASE (Tenure < 30d): {LADDER_DESCRIPTIONS[new_state]}',
                'changed': new_state != current_state,
                'previous_state': current_state,
            }
    
    return {
        'state': new_state,
        'credit_multiplier': CREDIT_MULTIPLIERS[new_state],
        'credit_action': LADDER_DESCRIPTIONS[new_state],
        'changed': new_state != current_state,
        'previous_state': current_state,
    }

"""
Bayesian Weight Evolution Engine for RiskSense AI.

Implements per-agency signal reliability tracking, personalised weight
evolution, signal lock detection, and the full trust score computation
pipeline from the specification (Parts 3 & 4).
"""

import datetime
import math
from typing import Dict, List, Tuple, Optional
from models import Agency, WeightProfile, SignalOutcome
from sqlalchemy.orm import Session
from chargeback_detector import detect_chargeback_phase
from containment import evaluate_containment_level

# ─── Platform-wide prior weights ───
PLATFORM_PRIOR = {
    'S1': 0.22, 'S2': 0.20, 'S3': 0.12, 'S4': 0.08,
    'S5': 0.16, 'S6': 0.04, 'S7': 0.04, 'S8': 0.14,
}

SIGNAL_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']

SIGNAL_NAMES = {
    'S1': 'Booking Velocity',    'S2': 'Refundable Ratio',
    'S3': 'Lead Time',           'S4': 'Cancellation Cascade',
    'S5': 'Credit Utilization',  'S6': 'Passenger Name Reuse',
    'S7': 'Destination Spike',   'S8': 'Settlement Delay',
}

SIGNAL_FRAUD_TYPES = {
    'S1': 'Account Takeover',       'S2': 'Chargeback Abuse',
    'S3': 'Chargeback Abuse',       'S4': 'Inventory Blocking',
    'S5': 'Credit Default',         'S6': 'Account Takeover / Chargeback Abuse',
    'S7': 'Chargeback + Inventory Blocking', 'S8': 'Credit Default',
}

# Signal half-lives for risk decay (framework spec)
SIGNAL_HALF_LIVES = {
    'S1': 7,   # Booking Velocity — fast decay
    'S2': 14,  # Refundable Ratio — medium
    'S3': 14,  # Lead Time — medium
    'S4': 30,  # Cancellation Cascade — medium-slow
    'S5': 60,  # Credit Utilization — slow (financial)
    'S6': 30,  # Passenger Name Reuse — medium
    'S7': 21,  # Destination Spike — medium
    'S8': 90,  # Settlement Delay — persistent
}

# Signal unlock thresholds (minimum tenure days / conditions)
SIGNAL_UNLOCK_REQUIREMENTS = {
    'S1': {'min_tenure_days': 21, 'description': 'Needs 21 days of booking history'},
    'S2': {'min_tenure_days': 14, 'description': 'Needs 14 days of booking history'},
    'S3': {'min_tenure_days': 14, 'description': 'Needs 14 days of booking history'},
    'S4': {'min_tenure_days': 0,  'description': 'Needs first cancellation event'},
    'S5': {'min_tenure_days': 0,  'description': 'Available from Day 1'},
    'S6': {'min_tenure_days': 0,  'description': 'Needs 20+ total bookings'},
    'S7': {'min_tenure_days': 14, 'description': 'Needs 14 days of booking history'},
    'S8': {'min_tenure_days': 0,  'description': 'Needs 2+ settled invoices'},
}

# Cohort prior deviations from platform prior
COHORT_PRIORS = {
    'Small Domestic': {
        'S4': 0.04, 'S5': 0.22,  # S4 less predictive, S5 more
    },
    'Large International': {
        'S4': 0.14, 'S3': 0.06,  # S4 highly predictive, S3 less (longer leads normal)
    },
}


def get_cohort_label(agency: Agency) -> str:
    """Derive cohort label from agency fields."""
    size = agency.cohort_group or 'Medium'
    dest = agency.destination_profile or 'Mixed'
    return f"{size} {dest}"


def get_cohort_prior(cohort_label: str) -> Dict[str, float]:
    """Return cohort-specific prior or platform-wide prior."""
    base = dict(PLATFORM_PRIOR)
    if cohort_label in COHORT_PRIORS:
        overrides = COHORT_PRIORS[cohort_label]
        # Apply overrides and redistribute
        for sig, val in overrides.items():
            base[sig] = val
        # Normalise to sum to 1.0
        total = sum(base.values())
        base = {k: v / total for k, v in base.items()}
    return base


def apply_risk_decay(
    signal_values: Dict[str, float],
    last_computed_at: Optional[datetime.datetime],
    now: datetime.datetime,
) -> Dict[str, float]:
    """
    Apply exponential decay to signal values based on their half-lives.
    decayed = raw_value × 0.5^(days_elapsed / half_life)
    Trust recovers naturally when behaviour is clean.
    """
    if last_computed_at is None:
        return dict(signal_values)  # No previous data — no decay to apply

    days_elapsed = max(0, (now - last_computed_at).total_seconds() / 86400.0)
    if days_elapsed < 0.01:
        return dict(signal_values)  # Less than ~15 minutes — no meaningful decay

    decayed = {}
    for sig in SIGNAL_IDS:
        raw = signal_values.get(sig, 0.0)
        half_life = SIGNAL_HALF_LIVES[sig]
        decay_factor = math.pow(0.5, days_elapsed / half_life)
        decayed[sig] = round(raw * decay_factor, 4)
    return decayed


# ─── Fraud Hypothesis Signal Mappings ───
FRAUD_SIGNAL_GROUPS = {
    'Account Takeover': ['S1', 'S6'],           # Velocity + Name Reuse
    'Chargeback Abuse': ['S2', 'S3', 'S1'],     # Refundable + Lead Time + Velocity
    'Inventory Blocking': ['S4', 'S7'],          # Cancellation + Destination
    'Credit Default': ['S5', 'S8'],              # Credit Util + Settlement Delay
}


def determine_fraud_hypothesis(
    signal_values: Dict[str, float],
    locked_signals: Dict[str, dict],
    threshold: float = 0.5,
) -> List[dict]:
    """
    Determine which fraud hypotheses are supported by elevated signals.
    Returns list of {'hypothesis': str, 'matching_signals': list, 'match_count': int}
    sorted by match_count descending.
    """
    elevated = set(
        sig for sig in SIGNAL_IDS
        if not locked_signals.get(sig, {}).get('locked', False)
        and signal_values.get(sig, 0) > threshold
    )

    hypotheses = []
    for fraud_type, required_signals in FRAUD_SIGNAL_GROUPS.items():
        matching = [s for s in required_signals if s in elevated]
        if matching:
            hypotheses.append({
                'hypothesis': fraud_type,
                'matching_signals': matching,
                'match_count': len(matching),
                'total_required': len(required_signals),
            })

    hypotheses.sort(key=lambda x: x['match_count'], reverse=True)
    return hypotheses


def classify_signal_strength(
    signal_values: Dict[str, float],
    locked_signals: Dict[str, dict],
    risk: float = 0.0,
    threshold: float = 0.5,
) -> dict:
    """
    Classify overall signal strength per the framework combination rule:
      WEAK:     0-1 signals elevated → watch only, no action
      MODERATE: 2 related signals → analyst notification, surgical controls considered
      STRONG:   3+ signals corroborating same fraud hypothesis → autonomous credit action
      CRITICAL: core risk above threshold + amplifier signals (S6/S7) firing → immediate action
    
    Returns {
        'strength': str,
        'elevated_count': int,
        'elevated_signals': list,
        'primary_hypothesis': str or None,
        'hypotheses': list,
        'recommended_action': str,
    }
    """
    elevated = [
        sig for sig in SIGNAL_IDS
        if not locked_signals.get(sig, {}).get('locked', False)
        and signal_values.get(sig, 0) > threshold
    ]
    elevated_count = len(elevated)

    hypotheses = determine_fraud_hypothesis(signal_values, locked_signals, threshold)
    primary = hypotheses[0] if hypotheses else None

    # Amplifier check: S6/S7 above threshold
    s6_amp = signal_values.get('S6', 0) > threshold
    s7_amp = signal_values.get('S7', 0) > threshold
    amplifier_firing = s6_amp or s7_amp

    # Classification
    if risk > 0.55 and amplifier_firing and elevated_count >= 2:
        strength = 'CRITICAL'
        action = 'Immediate action. Human review for fraud type classification.'
    elif elevated_count >= 3 and primary and primary['match_count'] >= 2:
        strength = 'STRONG'
        action = f"Autonomous credit action — {primary['hypothesis']} hypothesis corroborated by {primary['match_count']} signals."
    elif elevated_count >= 2 and primary and primary['match_count'] >= 2:
        strength = 'MODERATE'
        action = f"Analyst notification. Surgical controls considered for {primary['hypothesis']}."
    else:
        strength = 'WEAK'
        action = 'Watch only. No credit action from signals alone.'

    return {
        'strength': strength,
        'elevated_count': elevated_count,
        'elevated_signals': elevated,
        'primary_hypothesis': primary['hypothesis'] if primary else None,
        'hypotheses': hypotheses,
        'recommended_action': action,
    }


def get_signal_lock_status(
    agency: Agency,
    db: Session,
    total_bookings: int = None,
    has_cancellation: bool = None,
    settled_invoices: int = None,
) -> Dict[str, dict]:
    """
    Determine which signals are locked for this agency.
    Returns dict: signal_id -> {'locked': bool, 'reason': str}
    """
    from models import BookingEvent, InvoicePayment
    tenure = agency.platform_tenure_days or 0

    if total_bookings is None:
        total_bookings = db.query(BookingEvent).filter(
            BookingEvent.agency_id == agency.id,
            BookingEvent.event_type == 'booking'
        ).count()

    if has_cancellation is None:
        has_cancellation = db.query(BookingEvent).filter(
            BookingEvent.agency_id == agency.id,
            BookingEvent.event_type == 'cancellation'
        ).count() > 0

    if settled_invoices is None:
        settled_invoices = db.query(InvoicePayment).filter(
            InvoicePayment.agency_id == agency.id,
            InvoicePayment.paid_date.isnot(None)
        ).count()

    result = {}
    for sig in SIGNAL_IDS:
        req = SIGNAL_UNLOCK_REQUIREMENTS[sig]
        locked = False
        reason = ''

        if sig == 'S1' and tenure < 21:
            locked, reason = True, f'Tenure {tenure}d < 21d required for velocity baseline'
        elif sig == 'S2' and tenure < 14:
            locked, reason = True, f'Tenure {tenure}d < 14d required for refundable baseline'
        elif sig == 'S3' and tenure < 14:
            locked, reason = True, f'Tenure {tenure}d < 14d required for lead time baseline'
        elif sig == 'S4' and not has_cancellation:
            locked, reason = True, 'No cancellation events recorded yet'
        elif sig == 'S6' and total_bookings < 20:
            locked, reason = True, f'Only {total_bookings} bookings < 20 required'
        elif sig == 'S7' and tenure < 14:
            locked, reason = True, f'Tenure {tenure}d < 14d required for destination baseline'
        elif sig == 'S8' and settled_invoices < 2:
            locked, reason = True, f'Only {settled_invoices} settled invoices < 2 required'

        result[sig] = {'locked': locked, 'reason': reason}

    return result


def compute_f1_reliability(tp: int, fp: int, tn: int, fn: int) -> float:
    """
    F1 reliability score for a signal.
    Returns 0.5 if no confirmed positives (uncertain).
    """
    if tp == 0 and fp == 0:
        return 0.5  # Never fired — uninformative

    if tp == 0:
        return 0.5  # No confirmed positives yet

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    if precision + recall == 0:
        return 0.0

    return 2 * (precision * recall) / (precision + recall)


def compute_learning_rate(total_observations: int) -> float:
    """Learning rate: min(0.5, observations / 100)."""
    return min(0.5, total_observations / 100.0)


def get_outcome_counters(db: Session, agency_id: str) -> Dict[str, dict]:
    """Fetch all outcome counters for an agency, keyed by signal_id."""
    outcomes = db.query(SignalOutcome).filter(
        SignalOutcome.agency_id == agency_id
    ).all()

    result = {}
    for o in outcomes:
        result[o.signal_id] = {
            'tp': o.true_positives,
            'fp': o.false_positives,
            'tn': o.true_negatives,
            'fn': o.false_negatives,
        }

    # Fill missing signals with zeros
    for sig in SIGNAL_IDS:
        if sig not in result:
            result[sig] = {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0}

    return result


def compute_personalised_weights(
    prior_weights: Dict[str, float],
    reliabilities: Dict[str, float],
    learning_rate: float,
    locked_signals: Dict[str, dict],
) -> Dict[str, float]:
    """
    Compute personalised weights using Bayesian update rule:
        raw_weight = prior × (1 - lr) + reliability × lr
    Then normalise unlocked weights to sum to 1.0.
    """
    raw_weights = {}
    for sig in SIGNAL_IDS:
        if locked_signals[sig]['locked']:
            raw_weights[sig] = 0.0
        else:
            raw = prior_weights[sig] * (1 - learning_rate) + reliabilities[sig] * learning_rate
            raw_weights[sig] = raw

    # Normalise unlocked weights
    total = sum(v for v in raw_weights.values() if v > 0)
    if total > 0:
        for sig in SIGNAL_IDS:
            if not locked_signals[sig]['locked']:
                raw_weights[sig] = raw_weights[sig] / total

    return raw_weights


def compute_bayesian_trust_score(
    signal_values: Dict[str, float],
    personalised_weights: Dict[str, float],
    locked_signals: Dict[str, dict],
    tenure_days: int,
    learning_rate: float,
    total_observations: int,
) -> dict:
    """
    Full Part 4 pipeline:
    1. Weighted risk from personalised weights
    2. Amplifier check (S6/S7 > 0.5 AND risk > 0.55)
    3. Tenure uncertainty premium (< 90 days)
    4. Trust Score = round((1 - risk) * 100)
    5. Decision confidence assessment

    Returns dict with all computation details.
    """
    # Step 1 — Weighted risk
    contributions = {}
    risk = 0.0
    for sig in SIGNAL_IDS:
        if locked_signals[sig]['locked']:
            contributions[sig] = 0.0
        else:
            contrib = personalised_weights[sig] * signal_values[sig]
            contributions[sig] = round(contrib, 4)
            risk += contrib

    risk = round(risk, 4)

    # Step 2 — Amplifier
    amplifier_applied = False
    s6_val = signal_values.get('S6', 0)
    s7_val = signal_values.get('S7', 0)
    if (s6_val > 0.5 or s7_val > 0.5) and risk > 0.55:
        risk = min(1.0, risk * 1.15)
        amplifier_applied = True

    # Step 3 — Tenure uncertainty premium
    tenure_adjustment = 0.0
    if tenure_days < 90:
        tenure_adjustment = 0.05 * (1 - tenure_days / 90.0)
        # Cold Start Probationary Penalty
        if tenure_days < 30:
            tenure_adjustment += 0.15
        risk = min(1.0, risk + tenure_adjustment)

    risk = round(risk, 4)

    # Step 3.5 — Velocity Circuit Breaker (Sleeper Cell Protection)
    # If S1 velocity indicates an extreme spike (>3x), override risk to maximum automatically
    s1_val = signal_values.get('S1', 0.0)
    circuit_breaker_tripped = False
    if s1_val > 0.9:
        risk = 1.0
        circuit_breaker_tripped = True

    # Step 4 — Trust Score
    trust_score = round((1 - risk) * 100)
    trust_score = max(0, min(100, trust_score))

    # Step 5 — Decision band
    if circuit_breaker_tripped:
        band = 'RESTRICTED'
        credit_action = 'CIRCUIT BREAKER TRIGGERED: >3x velocity spike. Pending admin approval to BLOCK.'
    elif trust_score >= 76:
        band = 'CLEAR'
        credit_action = 'Full credit. No restrictions.'
    elif trust_score >= 56:
        band = 'CAUTION'
        credit_action = 'Flag for analyst review in 5 days.'
    elif trust_score >= 36:
        band = 'WARNING'
        credit_action = 'Reduce credit to 75%.'
    elif trust_score >= 16:
        band = 'RESTRICTED'
        credit_action = 'Reduce credit to 40%. All bookings queued.'
    else:
        band = 'RESTRICTED'
        credit_action = 'Score critical. Pending admin approval to BLOCK.'

    # Step 6 — Decision confidence
    unlocked_elevated = sum(
        1 for sig in SIGNAL_IDS
        if not locked_signals[sig]['locked'] and signal_values.get(sig, 0) > 0.5
    )
    unlocked_count = sum(1 for sig in SIGNAL_IDS if not locked_signals[sig]['locked'])
    locked_count = 8 - unlocked_count

    if tenure_days > 90 and learning_rate > 0.3 and unlocked_elevated >= 3:
        confidence = 'HIGH'
        confidence_reason = (
            f"Tenure {tenure_days}d, learning rate {learning_rate:.2f} with "
            f"{total_observations} observations, {unlocked_elevated} corroborating signals."
        )
    elif learning_rate >= 0.1 and tenure_days >= 30:
        confidence = 'MEDIUM'
        confidence_reason = (
            f"Learning rate {learning_rate:.2f}, tenure {tenure_days}d. "
            f"Pattern visible but alternative explanations may remain."
        )
    else:
        confidence = 'LOW'
        confidence_reason = (
            f"Learning rate {learning_rate:.2f} ({'close to prior' if learning_rate < 0.1 else 'moderate'}), "
            f"tenure {tenure_days}d. {'Critical signals locked.' if locked_count > 2 else 'Thin history.'}"
        )

    # Determine if acting autonomously
    can_act_autonomously = (
        (confidence == 'HIGH' and trust_score > 65) or
        (confidence == 'HIGH' and trust_score < 15)
    )

    return {
        'risk': risk,
        'trust_score': trust_score,
        'band': band,
        'credit_action': credit_action,
        'contributions': contributions,
        'amplifier_applied': amplifier_applied,
        'tenure_adjustment': round(tenure_adjustment, 4),
        'confidence': confidence,
        'confidence_reason': confidence_reason,
        'can_act_autonomously': can_act_autonomously,
    }


def determine_trajectory(current_score: int, previous_score: Optional[int]) -> str:
    """Determine trajectory from previous to current score."""
    if previous_score is None:
        return 'NEW'
    diff = current_score - previous_score
    if diff >= 10:
        return 'IMPROVING'
    elif diff <= -25:
        return 'COLLAPSED'
    elif diff <= -5:
        return 'DETERIORATING'
    else:
        return 'STABLE'


def build_investigation_snapshot(
    db: Session,
    agency: Agency,
    signal_values: Dict[str, float],
    previous_signal_values: Optional[Dict[str, float]] = None,
) -> dict:
    """
    Build a complete investigation snapshot for the agency,
    matching the Part 7 output format.
    """
    cohort_label = get_cohort_label(agency)
    prior_weights = get_cohort_prior(cohort_label)

    # Get or compute weight profile
    wp = agency.weight_profile
    if not wp:
        wp = _create_default_weight_profile(db, agency.id, prior_weights)

    # Outcome counters
    counters = get_outcome_counters(db, agency.id)

    # Reliabilities
    reliabilities = {}
    for sig in SIGNAL_IDS:
        c = counters[sig]
        reliabilities[sig] = compute_f1_reliability(c['tp'], c['fp'], c['tn'], c['fn'])

    # Lock status
    locked = get_signal_lock_status(agency, db)

    # Learning rate
    lr = compute_learning_rate(wp.total_observations)

    # Personalised weights
    p_weights = compute_personalised_weights(prior_weights, reliabilities, lr, locked)

    # Trust score
    result = compute_bayesian_trust_score(
        signal_values, p_weights, locked,
        agency.platform_tenure_days or 0,
        lr, wp.total_observations,
    )

    # Trajectory
    trajectory = determine_trajectory(result['trust_score'], wp.previous_trust_score)

    # Multi-signal combination classification
    sig_strength = classify_signal_strength(
        signal_values, locked, risk=result['risk'],
    )

    # Build signal details
    signal_details = []
    for sig in SIGNAL_IDS:
        val = signal_values[sig]
        prev_val = previous_signal_values.get(sig) if previous_signal_values else None

        if prev_val is not None:
            if val > prev_val + 0.05:
                direction = '↑'
            elif val < prev_val - 0.05:
                direction = '↓'
            else:
                direction = '→'
        else:
            direction = '→'

        if locked[sig]['locked']:
            status = 'LOCKED'
        elif val >= 0.7:
            status = 'CRITICAL'
        elif val >= 0.4:
            status = 'ELEVATED'
        else:
            status = 'NORMAL'

        c = counters[sig]
        signal_details.append({
            'id': sig,
            'name': SIGNAL_NAMES[sig],
            'fraud_type': SIGNAL_FRAUD_TYPES[sig],
            'value': round(val, 2),
            'direction': direction,
            'weight': round(p_weights[sig], 4),
            'prior_weight': round(prior_weights[sig], 4),
            'status': status,
            'locked': locked[sig]['locked'],
            'lock_reason': locked[sig]['reason'],
            'reliability': round(reliabilities[sig], 2),
            'tp': c['tp'], 'fp': c['fp'],
            'tn': c['tn'], 'fn': c['fn'],
            'contribution': result['contributions'][sig],
        })

    # Determine trusted / discounted signals
    trusted_signals = [
        f"{s['id']} {s['name']} (reliability: {s['reliability']:.2f})"
        for s in sorted(signal_details, key=lambda x: x['reliability'], reverse=True)
        if not s['locked'] and s['reliability'] >= 0.7
    ]
    discounted_signals = [
        f"{s['id']} {s['name']} (reliability: {s['reliability']:.2f})"
        for s in signal_details
        if not s['locked'] and s['reliability'] < 0.3
    ]
    locked_signals_list = [
        f"{s['id']} — {s['lock_reason']}"
        for s in signal_details if s['locked']
    ]

    return {
        'agency_id': agency.id,
        'agency_name': agency.name,
        'tenure_days': agency.platform_tenure_days or 0,
        'cohort': cohort_label,
        'learning_rate': round(lr, 2),
        'total_observations': wp.total_observations,
        'trusted_signals': trusted_signals,
        'discounted_signals': discounted_signals,
        'locked_signals': locked_signals_list,
        'signals': signal_details,
        'trust_score': result['trust_score'],
        'previous_score': wp.previous_trust_score,
        'trajectory': trajectory,
        'risk': result['risk'],
        'band': result['band'],
        'credit_action': result['credit_action'],
        'contributions': result['contributions'],
        'amplifier_applied': result['amplifier_applied'],
        'tenure_adjustment': result['tenure_adjustment'],
        'confidence': result['confidence'],
        'confidence_reason': result['confidence_reason'],
        'can_act_autonomously': result['can_act_autonomously'],
        'signal_strength': sig_strength['strength'],
        'elevated_count': sig_strength['elevated_count'],
        'elevated_signals': sig_strength['elevated_signals'],
        'fraud_hypothesis': sig_strength['primary_hypothesis'],
        'fraud_hypotheses': sig_strength['hypotheses'],
        'combination_action': sig_strength['recommended_action'],
        # Chargeback phase detection
        'chargeback_phase': detect_chargeback_phase(signal_values, agency),
        # Three-level containment recommendation
        'containment': evaluate_containment_level(
            signal_strength=sig_strength['strength'],
            elevated_signals=sig_strength['elevated_signals'],
            fraud_hypothesis=sig_strength['primary_hypothesis'],
            trust_score=result['trust_score'],
            confidence=result['confidence'],
        ),
    }


def _create_default_weight_profile(db: Session, agency_id: str, prior: Dict[str, float]) -> WeightProfile:
    """Create a default weight profile with prior weights."""
    wp = WeightProfile(
        agency_id=agency_id,
        w1_velocity=prior['S1'], w2_refundable_ratio=prior['S2'],
        w3_lead_time=prior['S3'], w4_cancellation_cascade=prior['S4'],
        w5_credit_utilization=prior['S5'], w6_passenger_name_reuse=prior['S6'],
        w7_destination_spike=prior['S7'], w8_settlement_delay=prior['S8'],
        total_observations=0, learning_rate=0.0,
    )
    db.add(wp)
    db.commit()
    db.refresh(wp)
    return wp

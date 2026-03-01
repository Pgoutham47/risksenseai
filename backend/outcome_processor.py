"""
Outcome Processor for the Bayesian Weight Evolution Engine.

Processes observable outcome events (invoice payments, chargebacks, etc.)
and updates SignalOutcome counters + recalculates WeightProfile.
"""

import datetime
from sqlalchemy.orm import Session
from models import Agency, SignalOutcome, WeightProfile, SignalScore, InvoicePayment
from bayesian_scoring import (
    SIGNAL_IDS, PLATFORM_PRIOR,
    compute_f1_reliability, compute_learning_rate,
    get_cohort_label, get_cohort_prior,
)

# A signal is considered "HIGH" if its value exceeds this threshold
HIGH_THRESHOLD = 0.4
LOW_THRESHOLD = 0.3


def _get_or_create_outcome(db: Session, agency_id: str, signal_id: str) -> SignalOutcome:
    """Get or create a SignalOutcome row."""
    outcome = db.query(SignalOutcome).filter(
        SignalOutcome.agency_id == agency_id,
        SignalOutcome.signal_id == signal_id,
    ).first()
    if not outcome:
        outcome = SignalOutcome(
            agency_id=agency_id,
            signal_id=signal_id,
            true_positives=0, false_positives=0,
            true_negatives=0, false_negatives=0,
        )
        db.add(outcome)
        db.flush()
    return outcome


def _get_recent_signal_values(db: Session, agency_id: str, lookback_days: int = 14) -> dict:
    """Get the most recent signal score snapshot for the agency."""
    score = db.query(SignalScore).filter(
        SignalScore.agency_id == agency_id
    ).order_by(SignalScore.computed_at.desc()).first()

    if not score:
        return {sig: 0.0 for sig in SIGNAL_IDS}

    return {
        'S1': score.s1_velocity, 'S2': score.s2_refundable_ratio,
        'S3': score.s3_lead_time, 'S4': score.s4_cancellation_cascade,
        'S5': score.s5_credit_utilization, 'S6': score.s6_passenger_name_reuse,
        'S7': score.s7_destination_spike, 'S8': score.s8_settlement_delay,
    }


def process_invoice_outcome(db: Session, agency_id: str, invoice: InvoicePayment):
    """
    Process an invoice payment outcome:
    - Paid on time (0-1 days late): HIGH signals get FP marks, LOW signals get TN marks.
    - Paid late with worsening trend: S5/S8 HIGH get TP, LOW get FN.
    """
    signals = _get_recent_signal_values(db, agency_id)

    if invoice.days_late <= 1:
        # Paid on time — signals that fired HIGH were wrong
        for sig in SIGNAL_IDS:
            outcome = _get_or_create_outcome(db, agency_id, sig)
            if signals[sig] >= HIGH_THRESHOLD:
                outcome.false_positives += 1
            elif signals[sig] <= LOW_THRESHOLD:
                outcome.true_negatives += 1
            outcome.last_updated = datetime.datetime.utcnow()
    else:
        # Paid late — S5 and S8 predictions confirmed
        for sig in ['S5', 'S8']:
            outcome = _get_or_create_outcome(db, agency_id, sig)
            if signals[sig] >= HIGH_THRESHOLD:
                outcome.true_positives += 1
            elif signals[sig] <= LOW_THRESHOLD:
                outcome.false_negatives += 1
            outcome.last_updated = datetime.datetime.utcnow()


def process_chargeback(db: Session, agency_id: str):
    """
    Process a chargeback dispute:
    - All HIGH signals get TP marks.
    - All LOW signals get FN marks.
    """
    signals = _get_recent_signal_values(db, agency_id)

    for sig in SIGNAL_IDS:
        outcome = _get_or_create_outcome(db, agency_id, sig)
        if signals[sig] >= HIGH_THRESHOLD:
            outcome.true_positives += 1
        elif signals[sig] <= LOW_THRESHOLD:
            outcome.false_negatives += 1
        outcome.last_updated = datetime.datetime.utcnow()


def process_velocity_normalisation(db: Session, agency_id: str):
    """S1 velocity spike normalised → FP mark for S1."""
    outcome = _get_or_create_outcome(db, agency_id, 'S1')
    outcome.false_positives += 1
    outcome.last_updated = datetime.datetime.utcnow()


def process_refundable_normalisation(db: Session, agency_id: str):
    """S2 refundable ratio returned to baseline → FP mark for S2."""
    outcome = _get_or_create_outcome(db, agency_id, 'S2')
    outcome.false_positives += 1
    outcome.last_updated = datetime.datetime.utcnow()


def process_cancellation_normalisation(db: Session, agency_id: str):
    """S4 cancellation cascade normalised → FP mark for S4."""
    outcome = _get_or_create_outcome(db, agency_id, 'S4')
    outcome.false_positives += 1
    outcome.last_updated = datetime.datetime.utcnow()


def process_credit_normalisation(db: Session, agency_id: str):
    """S5 credit utilization dropped below 70% → FP mark for S5."""
    outcome = _get_or_create_outcome(db, agency_id, 'S5')
    outcome.false_positives += 1
    outcome.last_updated = datetime.datetime.utcnow()


def process_account_compromise(db: Session, agency_id: str):
    """Account confirmed compromised → S1/S6 HIGH get TP marks."""
    signals = _get_recent_signal_values(db, agency_id)
    for sig in ['S1', 'S6']:
        outcome = _get_or_create_outcome(db, agency_id, sig)
        if signals[sig] >= HIGH_THRESHOLD:
            outcome.true_positives += 1
        outcome.last_updated = datetime.datetime.utcnow()


def recalculate_weight_profile(db: Session, agency_id: str):
    """
    Recompute all reliabilities and raw weights from outcome counters,
    then save to the WeightProfile.
    """
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        return

    cohort_label = get_cohort_label(agency)
    prior = get_cohort_prior(cohort_label)

    # Get outcome counters
    outcomes = db.query(SignalOutcome).filter(
        SignalOutcome.agency_id == agency_id
    ).all()

    counters = {}
    total_obs = 0
    for o in outcomes:
        counters[o.signal_id] = {
            'tp': o.true_positives, 'fp': o.false_positives,
            'tn': o.true_negatives, 'fn': o.false_negatives,
        }
        total_obs += o.true_positives + o.false_positives + o.true_negatives + o.false_negatives

    # Average per signal
    total_obs_per_signal = total_obs // max(len(counters), 1)
    lr = compute_learning_rate(total_obs_per_signal)

    # Compute reliabilities
    reliabilities = {}
    for sig in SIGNAL_IDS:
        c = counters.get(sig, {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0})
        reliabilities[sig] = compute_f1_reliability(c['tp'], c['fp'], c['tn'], c['fn'])

    # Get or create weight profile
    wp = db.query(WeightProfile).filter(WeightProfile.agency_id == agency_id).first()
    if not wp:
        wp = WeightProfile(agency_id=agency_id)
        db.add(wp)

    # Apply weight update rule
    raw_weights = {}
    for sig in SIGNAL_IDS:
        raw = prior[sig] * (1 - lr) + reliabilities[sig] * lr
        raw_weights[sig] = raw

    # Normalise
    total = sum(raw_weights.values())
    if total > 0:
        raw_weights = {k: v / total for k, v in raw_weights.items()}

    # Update profile
    wp.w1_velocity = raw_weights['S1']
    wp.w2_refundable_ratio = raw_weights['S2']
    wp.w3_lead_time = raw_weights['S3']
    wp.w4_cancellation_cascade = raw_weights['S4']
    wp.w5_credit_utilization = raw_weights['S5']
    wp.w6_passenger_name_reuse = raw_weights['S6']
    wp.w7_destination_spike = raw_weights['S7']
    wp.w8_settlement_delay = raw_weights['S8']

    wp.r1_velocity = reliabilities['S1']
    wp.r2_refundable_ratio = reliabilities['S2']
    wp.r3_lead_time = reliabilities['S3']
    wp.r4_cancellation_cascade = reliabilities['S4']
    wp.r5_credit_utilization = reliabilities['S5']
    wp.r6_passenger_name_reuse = reliabilities['S6']
    wp.r7_destination_spike = reliabilities['S7']
    wp.r8_settlement_delay = reliabilities['S8']

    wp.total_observations = total_obs_per_signal
    wp.learning_rate = lr

    db.commit()

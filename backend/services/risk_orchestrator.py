import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Agency, SignalScore, Decision, WeightProfile, InvoicePayment
from signals import compute_all_signals, get_db_now
from scoring import compute_trust_score
from bayesian_scoring import (
    get_signal_lock_status, get_cohort_label, get_cohort_prior,
    get_outcome_counters, compute_f1_reliability, compute_learning_rate,
    compute_personalised_weights, SIGNAL_IDS, apply_risk_decay,
    classify_signal_strength
)
from credit_ladder import compute_ladder_state
from outcome_processor import process_invoice_outcome, recalculate_weight_profile
from services.alert_service import AlertService
from tbo_logger import logger

class RiskOrchestrator:
    @staticmethod
    def recompute_and_alert(db: Session, agency_id: str):
        """
        Full Risk Engine Pipeline:
        1. Compute signals & save SignalScore
        2. Apply risk decay
        3. Compute Bayesian personalised weights
        4. Compute Trust Score
        5. Save Decision & Update Credit Ladder
        6. Evaluate Alerts
        7. Process outcomes & update weights
        """
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if not agency:
            logger.error(f"Agency {agency_id} not found for risk recomputation")
            return None

        now = get_db_now()
        logger.info(f"Orchestrating full risk evaluation for {agency.name} ({agency_id})")

        try:
            # 1. Compute all 8 raw signals
            s1, s2, s3, s4, s5, s6, s7, s8 = compute_all_signals(db, agency, now)
            
            # 2. Save RAW signals to signal_scores table (for audit trail)
            ss = SignalScore(
                agency_id=agency.id,
                computed_at=now,
                s1_velocity=s1, s2_refundable_ratio=s2,
                s3_lead_time=s3, s4_cancellation_cascade=s4,
                s5_credit_utilization=s5, s6_passenger_name_reuse=s6,
                s7_destination_spike=s7, s8_settlement_delay=s8
            )
            db.add(ss)
            
            # 2b. Apply risk decay
            prev_score_record = db.query(SignalScore).filter(
                SignalScore.agency_id == agency.id
            ).order_by(SignalScore.computed_at.desc()).offset(1).first()
            last_computed = prev_score_record.computed_at if prev_score_record else None
            
            raw_signals = {
                'S1': s1, 'S2': s2, 'S3': s3, 'S4': s4,
                'S5': s5, 'S6': s6, 'S7': s7, 'S8': s8,
            }
            decayed_signals = apply_risk_decay(raw_signals, last_computed, now)
            ds1, ds2, ds3, ds4 = decayed_signals['S1'], decayed_signals['S2'], decayed_signals['S3'], decayed_signals['S4']
            ds5, ds6, ds7, ds8 = decayed_signals['S5'], decayed_signals['S6'], decayed_signals['S7'], decayed_signals['S8']
            
            # 3. Get personalised weights (Bayesian)
            wp = db.query(WeightProfile).filter(WeightProfile.agency_id == agency.id).first()
            personalised_weights = None
            
            if wp and wp.total_observations > 0:
                locked = get_signal_lock_status(agency, db)
                prior = get_cohort_prior(get_cohort_label(agency))
                counters = get_outcome_counters(db, agency.id)
                
                reliabilities = {}
                for sig in SIGNAL_IDS:
                    c = counters[sig]
                    reliabilities[sig] = compute_f1_reliability(c['tp'], c['fp'], c['tn'], c['fn'])
                
                lr = compute_learning_rate(wp.total_observations)
                personalised_weights = compute_personalised_weights(prior, reliabilities, lr, locked)
            
            # 4. Compute Trust Score
            old_score = agency.current_trust_score
            trust_score, band, credit_action, counterfactual, top_signals = compute_trust_score(
                ds1, ds2, ds3, ds4, ds5, ds6, ds7, ds8,
                agency.platform_tenure_days,
                personalised_weights=personalised_weights,
            )
            
            # 5. Save Decision
            dec = Decision(
                agency_id=agency.id,
                trust_score=trust_score,
                band=band,
                credit_action=credit_action,
                top_signal_1=top_signals[0],
                top_signal_2=top_signals[1],
                top_signal_3=top_signals[2],
                explanation=f"Engine recomputed. Band set to {band}.",
                counterfactual_guidance=counterfactual
            )
            db.add(dec)
            
            # 6. Apply credit ladder
            agency.current_trust_score = trust_score
            agency.current_band = band
            
            prev_s8 = prev_score_record.s8_settlement_delay if prev_score_record else None
            ladder_result = compute_ladder_state(
                db, agency,
                s5=ds5, s8=ds8, s8_previous=prev_s8,
                trust_score=trust_score,
            )
            
            if ladder_result['changed']:
                agency.credit_ladder_state = ladder_result['state']
                multiplier = ladder_result['credit_multiplier']
                agency.available_credit = max(0, agency.credit_limit * multiplier - agency.outstanding_balance)
                
                # Low confidence alert
                if wp and wp.total_observations < 10 and trust_score < 55:
                    AlertService.trigger_alert(
                        db, agency.id, "Low Confidence Credit Action", "WARNING",
                        f"Credit ladder moved to {ladder_result['state']} with low confidence ({wp.total_observations} obs).",
                        now
                    )
            else:
                mult = ladder_result['credit_multiplier']
                agency.available_credit = max(0, agency.credit_limit * mult - agency.outstanding_balance)

            if wp:
                wp.previous_trust_score = old_score
            
            # 7. Evaluate Alerts
            AlertService.evaluate_risk_and_alert(
                db, agency, old_score, trust_score, decayed_signals, now
            )

            # 8. Post-processing
            pending_invoices = db.query(InvoicePayment).filter(
                InvoicePayment.agency_id == agency.id,
                InvoicePayment.paid_date.isnot(None),
            ).all()
            for inv in pending_invoices:
                process_invoice_outcome(db, agency.id, inv)
            recalculate_weight_profile(db, agency.id)

            db.commit()
            return {
                "agency_id": agency_id,
                "new_score": trust_score,
                "new_band": band,
                "prior_score": old_score
            }

        except Exception as e:
            logger.error(f"Error in RiskOrchestrator for {agency_id}: {e}")
            db.rollback()
            raise e

    @staticmethod
    def recompute_all(db: Session):
        """Recompute for all agencies."""
        agencies = db.query(Agency).all()
        results = []
        for agency in agencies:
            try:
                res = RiskOrchestrator.recompute_and_alert(db, agency.id)
                results.append(res)
            except Exception as e:
                logger.error(f"Failed recompute for {agency.id}: {e}")
        return results

"""Agency CRUD and investigation routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime

import models
import schemas
from database import get_db
from signals import get_db_now, compute_all_signals
from bayesian_scoring import (
    build_investigation_snapshot, get_signal_lock_status,
    get_cohort_label, get_cohort_prior, get_outcome_counters,
    compute_f1_reliability, SIGNAL_IDS,
)

router = APIRouter(tags=["agencies"])


@router.get("/agencies", response_model=List[schemas.AgencyProfile])
def list_agencies(db: Session = Depends(get_db)):
    return db.query(models.Agency).all()


@router.get("/agencies/{id}", response_model=schemas.AgencyProfile)
def get_agency(id: str, db: Session = Depends(get_db)):
    agency = db.query(models.Agency).filter(models.Agency.id == id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.get("/agencies/{id}/signals", response_model=schemas.SignalScoreOut)
def get_agency_signals(id: str, db: Session = Depends(get_db)):
    score = db.query(models.SignalScore).filter(
        models.SignalScore.agency_id == id
    ).order_by(models.SignalScore.computed_at.desc()).first()
    if not score:
        raise HTTPException(status_code=404, detail="No signals computed")
    return score


@router.get("/agencies/{id}/decisions", response_model=List[schemas.DecisionOut])
def get_agency_decisions(id: str, db: Session = Depends(get_db)):
    """Fetch all decisions for a specific agency, newest first."""
    return db.query(models.Decision)\
        .filter(models.Decision.agency_id == id)\
        .order_by(models.Decision.decided_at.desc())\
        .all()


@router.get("/agencies/{id}/score-history")
def get_agency_score_history(id: str, db: Session = Depends(get_db)):
    """Fetch 90-day score history for charts."""
    ninety_days_ago = get_db_now() - datetime.timedelta(days=90)
    decisions = db.query(models.Decision).filter(
        models.Decision.agency_id == id,
        models.Decision.decided_at >= ninety_days_ago
    ).order_by(models.Decision.decided_at.asc()).all()

    # Format for recharts: { date: "Jan 01", score: 85, event: "Optional event label" }
    history = []
    for d in decisions:
        history.append({
            "date": d.decided_at.strftime("%b %d"),
            "score": d.trust_score,
            "event": d.credit_action if d.credit_action and d.credit_action != "No change." else None
        })
    return history


@router.get("/agencies/{id}/events", response_model=List[schemas.BookingEventOut])
def get_agency_events(id: str, db: Session = Depends(get_db)):
    ninety_days_ago = get_db_now() - datetime.timedelta(days=90)
    return db.query(models.BookingEvent).filter(
        models.BookingEvent.agency_id == id,
        models.BookingEvent.timestamp >= ninety_days_ago
    ).order_by(models.BookingEvent.timestamp.desc()).all()


@router.get("/agencies/{id}/actions", response_model=List[schemas.AgencyActionOut])
def get_agency_actions(id: str, limit: int = 100, category: str = None, db: Session = Depends(get_db)):
    q = db.query(models.AgencyAction).filter(models.AgencyAction.agency_id == id)
    if category:
        q = q.filter(models.AgencyAction.category == category)
    return q.order_by(models.AgencyAction.timestamp.desc()).limit(limit).all()


@router.get("/agencies/{id}/weight-profile", response_model=schemas.WeightProfileOut)
def get_weight_profile(id: str, db: Session = Depends(get_db)):
    agency = db.query(models.Agency).filter(models.Agency.id == id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    wp = db.query(models.WeightProfile).filter(models.WeightProfile.agency_id == id).first()
    cohort_label = get_cohort_label(agency)
    prior = get_cohort_prior(cohort_label)
    counters = get_outcome_counters(db, id)

    weights = {}
    reliabilities = {}
    if wp:
        weights = {
            'S1': wp.w1_velocity, 'S2': wp.w2_refundable_ratio,
            'S3': wp.w3_lead_time, 'S4': wp.w4_cancellation_cascade,
            'S5': wp.w5_credit_utilization, 'S6': wp.w6_passenger_name_reuse,
            'S7': wp.w7_destination_spike, 'S8': wp.w8_settlement_delay,
        }
        reliabilities = {
            'S1': wp.r1_velocity, 'S2': wp.r2_refundable_ratio,
            'S3': wp.r3_lead_time, 'S4': wp.r4_cancellation_cascade,
            'S5': wp.r5_credit_utilization, 'S6': wp.r6_passenger_name_reuse,
            'S7': wp.r7_destination_spike, 'S8': wp.r8_settlement_delay,
        }
    else:
        weights = dict(prior)
        reliabilities = {sig: 0.5 for sig in SIGNAL_IDS}

    return {
        'agency_id': id,
        'total_observations': wp.total_observations if wp else 0,
        'learning_rate': wp.learning_rate if wp else 0.0,
        'previous_trust_score': wp.previous_trust_score if wp else None,
        'weights': weights,
        'reliabilities': reliabilities,
        'prior_weights': prior,
        'counters': counters,
    }


@router.get("/agencies/{id}/investigation", response_model=schemas.InvestigationSnapshot)
def get_investigation(id: str, db: Session = Depends(get_db)):
    agency = db.query(models.Agency).filter(models.Agency.id == id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    now = get_db_now()
    s1, s2, s3, s4, s5, s6, s7, s8 = compute_all_signals(db, agency, now)
    signal_values = {
        'S1': s1, 'S2': s2, 'S3': s3, 'S4': s4,
        'S5': s5, 'S6': s6, 'S7': s7, 'S8': s8,
    }

    prev_score = db.query(models.SignalScore).filter(
        models.SignalScore.agency_id == id
    ).order_by(models.SignalScore.computed_at.desc()).offset(1).first()
    prev_vals = None
    if prev_score:
        prev_vals = {
            'S1': prev_score.s1_velocity, 'S2': prev_score.s2_refundable_ratio,
            'S3': prev_score.s3_lead_time, 'S4': prev_score.s4_cancellation_cascade,
            'S5': prev_score.s5_credit_utilization, 'S6': prev_score.s6_passenger_name_reuse,
            'S7': prev_score.s7_destination_spike, 'S8': prev_score.s8_settlement_delay,
        }

    snapshot = build_investigation_snapshot(db, agency, signal_values, prev_vals)
    return snapshot


@router.post("/agencies/{id}/override")
def override_agency(id: str, req: schemas.OverrideRequest, db: Session = Depends(get_db)):
    agency = db.query(models.Agency).filter(models.Agency.id == id).first()
    if not agency:
        raise HTTPException(status_code=404)

    new_band = req.band if req.band else agency.current_band
    action_text = f"Analyst manual override to {new_band}" if req.band else "Analyst manual override"

    dec = models.Decision(
        agency_id=id,
        trust_score=agency.current_trust_score,
        band=new_band,
        credit_action=action_text,
        top_signal_1="N/A", top_signal_2="N/A",
        explanation="Analyst Override",
        counterfactual_guidance="Overridden by analyst.",
        analyst_override=True,
        analyst_notes=req.notes
    )
    db.add(dec)

    if req.band:
        agency.current_band = req.band
        if req.band == 'BLOCKED':
            agency.credit_ladder_state = 'FROZEN'
            agency.available_credit = 0.0

    db.commit()
    return {"status": "success"}

"""Analytics routes — real DB queries replacing hardcoded mock data."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
from database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/by-fraud-type")
def analytics_fraud(db: Session = Depends(get_db)):
    """
    Compute fraud type distribution from real agency data.
    Maps agency bands and signals to fraud type categories.
    """
    # Count agencies by their dominant fraud pattern based on band and signal history
    agencies = db.query(models.Agency).all()
    fraud_counts = {
        "Account Takeover": 0,
        "Chargeback Abuse": 0,
        "Credit Default": 0,
        "Inventory Blocking": 0,
    }

    for agency in agencies:
        # Get latest signal scores for this agency
        latest_signal = db.query(models.SignalScore).filter(
            models.SignalScore.agency_id == agency.id
        ).order_by(models.SignalScore.computed_at.desc()).first()

        if not latest_signal:
            continue

        # Determine dominant fraud type based on which signal group is highest
        ato_score = max(latest_signal.s1_velocity or 0, latest_signal.s6_passenger_name_reuse or 0)
        chargeback_score = max(
            latest_signal.s2_refundable_ratio or 0,
            latest_signal.s3_lead_time or 0,
        )
        credit_score = max(latest_signal.s5_credit_utilization or 0, latest_signal.s8_settlement_delay or 0)
        inventory_score = max(latest_signal.s4_cancellation_cascade or 0, latest_signal.s7_destination_spike or 0)

        scores = {
            "Account Takeover": ato_score,
            "Chargeback Abuse": chargeback_score,
            "Credit Default": credit_score,
            "Inventory Blocking": inventory_score,
        }

        # Only count if at least one signal is elevated (> 0.3)
        max_type = max(scores, key=scores.get)
        if scores[max_type] > 0.3:
            fraud_counts[max_type] += 1

    return fraud_counts


@router.get("/signal-stats")
def analytics_signal_stats(db: Session = Depends(get_db)):
    """
    Compute real signal statistics from the SignalScore table.
    Returns average value and trigger count (> 0.5) for each signal.
    """
    signal_columns = {
        "S1": models.SignalScore.s1_velocity,
        "S2": models.SignalScore.s2_refundable_ratio,
        "S3": models.SignalScore.s3_lead_time,
        "S4": models.SignalScore.s4_cancellation_cascade,
        "S5": models.SignalScore.s5_credit_utilization,
        "S6": models.SignalScore.s6_passenger_name_reuse,
        "S7": models.SignalScore.s7_destination_spike,
        "S8": models.SignalScore.s8_settlement_delay,
    }

    result = {}
    for signal_id, column in signal_columns.items():
        avg_val = db.query(func.avg(column)).scalar() or 0.0
        trigger_count = db.query(func.count()).filter(column > 0.5).scalar() or 0
        result[signal_id] = {
            "avg": round(float(avg_val), 3),
            "triggers": trigger_count,
        }

    return result


@router.get("/cohort")
def analytics_cohort(db: Session = Depends(get_db)):
    res = db.query(
        models.Agency.cohort_group,
        func.avg(models.Agency.current_trust_score)
    ).group_by(models.Agency.cohort_group).all()
    return [{"cohort": r[0] or "Unknown", "avg_score": round(r[1] or 0, 1)} for r in res]


@router.get("/credit-exposure")
def analytics_exposure(db: Session = Depends(get_db)):
    res = db.query(
        models.Agency.current_band,
        func.sum(models.Agency.outstanding_balance)
    ).group_by(models.Agency.current_band).all()
    return [{"band": r[0], "exposure": r[1] or 0} for r in res]


@router.get("/settlement-trend")
def analytics_settlement_trend(db: Session = Depends(get_db)):
    """
    30-day rolling average settlement delay from InvoicePayment table.
    Returns [{date, avgDelay}] for each day in the last 30 days.
    """
    import datetime as dt
    from collections import defaultdict

    now = dt.datetime.utcnow()
    thirty_days_ago = now - dt.timedelta(days=30)

    payments = db.query(models.InvoicePayment).filter(
        models.InvoicePayment.paid_date >= thirty_days_ago
    ).all()

    daily_sums = defaultdict(float)
    daily_counts = defaultdict(int)
    for p in payments:
        if p.paid_date:
            d_str = p.paid_date.date().isoformat()
            daily_sums[d_str] += float(p.days_late or 0)
            daily_counts[d_str] += 1

    result = []
    for i in range(30, -1, -1):
        d_str = (now - dt.timedelta(days=i)).date().isoformat()
        if d_str in daily_counts and daily_counts[d_str] > 0:
            avg = round(daily_sums[d_str] / daily_counts[d_str], 1)
        else:
            avg = 0
        result.append({"date": d_str, "avgDelay": avg})

    return result

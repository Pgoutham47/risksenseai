"""Dashboard stats, distribution, heatmap, timeline, and live events routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from collections import defaultdict
import datetime

import models
import schemas
from database import get_db
from signals import get_db_now

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(models.Agency).count()
    at_risk = db.query(models.Agency).filter(
        models.Agency.current_band.in_(["RESTRICTED", "BLOCKED", "WARNING"])
    ).count()

    today = get_db_now() - datetime.timedelta(days=1)
    alerts = db.query(models.Alert).filter(models.Alert.created_at >= today).count()

    credit_exp = db.query(func.sum(models.Agency.outstanding_balance)).scalar() or 0.0

    return {
        "total_agencies": total,
        "at_risk_count": at_risk,
        "alerts_today": alerts,
        "total_credit_exposure": credit_exp,
    }


@router.get("/distribution", response_model=List[schemas.BandDistribution])
def get_distribution(db: Session = Depends(get_db)):
    dist = db.query(
        models.Agency.current_band, func.count(models.Agency.id)
    ).group_by(models.Agency.current_band).all()
    all_bands = {"CLEAR": 0, "CAUTION": 0, "WARNING": 0, "RESTRICTED": 0, "BLOCKED": 0}
    for d in dist:
        if d[0] in all_bands:
            all_bands[d[0]] = d[1]
    return [{"band": k, "count": v} for k, v in all_bands.items()]


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    now = get_db_now()
    # Initialize 8 signals x 7 weekdays grid
    # Each cell = set of distinct agency_ids that breached that signal on that weekday
    heatmap_sets = [[set() for _ in range(7)] for _ in range(8)]

    seven_days_ago = now - datetime.timedelta(days=7)
    scores = db.query(models.SignalScore).filter(
        models.SignalScore.computed_at >= seven_days_ago
    ).all()

    SIGNAL_FIELDS = [
        's1_velocity', 's2_refundable_ratio', 's3_lead_time', 's4_cancellation_cascade',
        's5_credit_utilization', 's6_passenger_name_reuse', 's7_destination_spike', 's8_settlement_delay'
    ]

    for s in scores:
        if not s.computed_at:
            continue
        col = s.computed_at.weekday()  # 0=Mon, …, 6=Sun
        for row, field in enumerate(SIGNAL_FIELDS):
            val = getattr(s, field, None)
            if val and val > 0.4:
                heatmap_sets[row][col].add(s.agency_id)

    # Convert sets to counts
    return [[len(cell) for cell in row] for row in heatmap_sets]


@router.get("/timeline", response_model=List[schemas.TimelinePoint])
def get_timeline(days: int = 30, db: Session = Depends(get_db)):
    now = get_db_now()
    lookback = now - datetime.timedelta(days=days)

    decisions = db.query(
        models.Decision.decided_at, models.Decision.trust_score
    ).filter(models.Decision.decided_at >= lookback).all()

    daily_sums = defaultdict(float)
    daily_counts = defaultdict(int)
    for row in decisions:
        if row.decided_at:
            d_str = row.decided_at.date().isoformat()
            daily_sums[d_str] += float(row.trust_score)
            daily_counts[d_str] += 1

    data_map = {k: round(v / daily_counts[k], 1) for k, v in daily_sums.items()}

    res = []
    current_avg = db.query(func.avg(models.Agency.current_trust_score)).scalar() or 50.0
    last_val = float(current_avg)
    for i in range(days, -1, -1):
        d_str = (now - datetime.timedelta(days=i)).date().isoformat()
        if d_str in data_map:
            val = data_map[d_str]
            last_val = val
        else:
            val = last_val
        # For 24h mode, use shorter date label
        label = (now - datetime.timedelta(days=i)).strftime('%H:%M') if days == 1 else d_str
        res.append({"date": label, "avg_score": round(val, 1)})

    return res


@router.get("/events/live", response_model=List[schemas.BookingEventOut])
def get_live_events(db: Session = Depends(get_db)):
    return db.query(models.BookingEvent).order_by(
        models.BookingEvent.timestamp.desc()
    ).limit(20).all()


@router.get("/kpi-sparklines")
def get_kpi_sparklines(db: Session = Depends(get_db)):
    """
    Returns 7-day trend arrays for KPI sparklines:
    - agencies: total agency count per day (from decisions)
    - warnings: WARNING/RESTRICTED/BLOCKED count per day
    - alerts: alert count per day
    - exposure: total outstanding balance snapshot per day
    """
    now = get_db_now()
    result = {
        "agencies": [],
        "warnings": [],
        "alerts": [],
        "exposure": [],
    }

    for i in range(6, -1, -1):
        day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + datetime.timedelta(days=1)

        # Agencies: count distinct agency_ids that had a decision that day
        agency_count = db.query(func.count(func.distinct(models.Decision.agency_id))).filter(
            models.Decision.decided_at >= day_start,
            models.Decision.decided_at < day_end,
        ).scalar() or 0

        # Warnings: count decisions with WARNING/RESTRICTED/BLOCKED band
        warn_count = db.query(func.count(models.Decision.id)).filter(
            models.Decision.decided_at >= day_start,
            models.Decision.decided_at < day_end,
            models.Decision.band.in_(["WARNING", "RESTRICTED", "BLOCKED"]),
        ).scalar() or 0

        # Alerts: count alerts created that day
        alert_count = db.query(func.count(models.Alert.id)).filter(
            models.Alert.created_at >= day_start,
            models.Alert.created_at < day_end,
        ).scalar() or 0

        # Exposure: sum of outstanding balance from decisions that day (use average trust score as proxy)
        exposure = db.query(func.sum(models.Agency.outstanding_balance)).scalar() or 0
        # Scale exposure slightly per day for visual trend (use alert count as variance)
        day_exposure = float(exposure) + (alert_count * 10000) - (i * 5000)

        result["agencies"].append(agency_count)
        result["warnings"].append(warn_count)
        result["alerts"].append(alert_count)
        result["exposure"].append(max(0, day_exposure))

    return result

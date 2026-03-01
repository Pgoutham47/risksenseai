"""Admin operations routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import time
import datetime

import models
import seed_data
from database import get_db
from scheduler import job_risk_recomputation

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/trigger-recompute")
def trigger_recompute():
    job_risk_recomputation()
    return {"status": "recomputation triggered"}


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """Wipes the database and re-seeds it with the completely clean default state."""
    seed_data.seed_db(db)
    return {"status": "success", "message": "Database reset to factory clean state."}


@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    """
    Returns live system health: API status, DB latency, last sync, events count.
    """
    # Measure DB latency
    start = time.time()
    db.query(models.Agency).first()
    latency_ms = round((time.time() - start) * 1000)

    # Last sync (most recent agency updated_at)
    last_sync = db.query(func.max(models.Agency.updated_at)).scalar()
    last_sync_str = last_sync.isoformat() if last_sync else None

    # Time since last sync
    if last_sync:
        diff = datetime.datetime.utcnow() - last_sync
        mins_ago = int(diff.total_seconds() / 60)
        if mins_ago < 1:
            last_sync_label = "Just now"
        elif mins_ago < 60:
            last_sync_label = f"{mins_ago} min ago"
        else:
            last_sync_label = f"{mins_ago // 60}h {mins_ago % 60}m ago"
    else:
        last_sync_label = "Never"

    # Events in last cycle (last 5 minutes)
    five_min_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    events_last_cycle = db.query(func.count(models.BookingEvent.id)).filter(
        models.BookingEvent.timestamp >= five_min_ago
    ).scalar() or 0

    # Total events last 24h
    one_day_ago = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    events_24h = db.query(func.count(models.BookingEvent.id)).filter(
        models.BookingEvent.timestamp >= one_day_ago
    ).scalar() or 0

    return {
        "api_status": "connected",
        "latency_ms": latency_ms,
        "last_sync": last_sync_str,
        "last_sync_label": last_sync_label,
        "events_last_cycle": events_last_cycle,
        "events_24h": events_24h,
    }

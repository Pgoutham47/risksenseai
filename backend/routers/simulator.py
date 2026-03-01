"""Simulator routes — action injection and recent actions feed."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime
import random

import models
import schemas
from database import get_db
from services.simulation_engine import generate_action
from services.risk_orchestrator import RiskOrchestrator
from outcome_processor import recalculate_weight_profile

router = APIRouter(tags=["simulator"])


@router.post("/agencies/simulate-next")
def simulate_next_action(req: schemas.SimulateNextActionRequest, db: Session = Depends(get_db)):
    """Simulates the next logical action for an agency based on its persona, updates score, and logs it."""
    agency = db.query(models.Agency).filter(models.Agency.id == req.agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    now = datetime.datetime.utcnow()

    # Generate action using the data-driven simulation engine
    action, score_delta, decision_action = generate_action(agency, now)

    # Save Action
    db.add(action)

    import json
    import uuid

    # Sync action to actual business events for signal computation
    meta = {}
    if action.metadata_json:
        try:
            meta = json.loads(action.metadata_json)
        except Exception:
            pass

    if action.action_type == "booking_created":
        route = meta.get("route", "DEL→BOM")
        dest = route.split("→")[1] if "→" in route else "BOM"
        lead_days = meta.get("lead_days", 14)
        checkin = now + datetime.timedelta(days=lead_days)
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()),
            agency_id=agency.id,
            event_type="booking",
            booking_ref=meta.get("ref", f"BK-{random.randint(10000, 99999)}"),
            guest_name="Simulated Guest",
            destination_city=dest,
            booking_value=meta.get("value", 50000.0),
            is_refundable=meta.get("refundable", False),
            checkin_date=checkin,
            booking_date=now,
            timestamp=now
        )
        db.add(b_event)
    elif action.action_type == "booking_cancelled":
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()),
            agency_id=agency.id,
            event_type="cancellation",
            booking_ref=meta.get("pnr", f"BK-{random.randint(10000, 99999)}"),
            guest_name="Simulated Guest",
            destination_city="Unknown",
            booking_value=0.0,
            is_refundable=False,
            checkin_date=now,
            booking_date=now,
            timestamp=now
        )
        db.add(b_event)
    elif action.action_type in ["flight_search", "fare_quote_request"]:
        dest = meta.get("destination", "BOM")
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()),
            agency_id=agency.id,
            event_type="search",
            booking_ref=meta.get("ref", f"SRCH-{random.randint(10000, 99999)}"),
            guest_name="Simulated Searcher",
            destination_city=dest,
            booking_value=0.0,
            is_refundable=False,
            checkin_date=now,
            booking_date=now,
            timestamp=now
        )
        db.add(b_event)
    elif action.action_type == "invoice_generated":
        inv = models.InvoicePayment(
            id=str(uuid.uuid4()),
            agency_id=agency.id,
            invoice_ref=meta.get("invoice", f"INV-{random.randint(10000, 99999)}"),
            due_date=now + datetime.timedelta(days=15),
            paid_date=None,
            amount=meta.get("amount", 100000.0),
            days_late=0
        )
        db.add(inv)
        # Also add to live feed
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()), agency_id=agency.id, event_type=action.action_type,
            booking_ref=f"INV-{random.randint(1000,9999)}", booking_value=100000.0,
            is_refundable=False, timestamp=now
        )
        db.add(b_event)
    elif action.action_type == "payment_received":
        # Simulate paying the oldest unpaid invoice, or a random invoice if none
        oldest_inv = db.query(models.InvoicePayment).filter(
            models.InvoicePayment.agency_id == agency.id,
            models.InvoicePayment.paid_date == None
        ).order_by(models.InvoicePayment.due_date.asc()).first()
        
        if oldest_inv:
            oldest_inv.paid_date = now
            days_late = (now - oldest_inv.due_date).days
            oldest_inv.days_late = max(0, days_late)
        else:
            inv = models.InvoicePayment(
                id=str(uuid.uuid4()),
                agency_id=agency.id,
                invoice_ref=meta.get("ref", f"INV-{random.randint(10000, 99999)}"),
                due_date=now - datetime.timedelta(days=2),
                paid_date=now,
                amount=meta.get("amount", 50000.0),
                days_late=2
            )
            db.add(inv)
        # Also add to live feed
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()), agency_id=agency.id, event_type=action.action_type,
            booking_ref=f"PAY-{random.randint(1000,9999)}", booking_value=50000.0,
            is_refundable=False, timestamp=now
        )
        db.add(b_event)
    else:
        # For all other injected event types (velocity_spike, etc), add to live feed directly
        b_event = models.BookingEvent(
            id=str(uuid.uuid4()),
            agency_id=agency.id,
            event_type=action.action_type,
            booking_ref=f"EVT-{random.randint(10000, 99999)}",
            guest_name="Simulator Injection",
            destination_city="System",
            booking_value=0.0,
            is_refundable=False,
            checkin_date=now,
            booking_date=now,
            timestamp=now
        )
        db.add(b_event)

    # Commit events so RiskOrchestrator sees them
    db.commit()

    # Recompute Risk and trigger Alerts immediately (Proactive)
    RiskOrchestrator.recompute_and_alert(db, agency.id)

    db.refresh(agency)

    # Recalculate weights based on new outcomes
    recalculate_weight_profile(db, agency.id)

    return {
        "status": "success",
        "action_injected": schemas.AgencyActionOut.model_validate(action),
        "new_trust_score": agency.current_trust_score,
        "new_band": agency.current_band,
        "new_credit_limit": agency.credit_limit,
    }


@router.get("/actions/recent", response_model=List[schemas.AgencyActionOut])
def get_recent_actions(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch the most recent actions across all agencies for a live feed."""
    return db.query(models.AgencyAction)\
        .order_by(models.AgencyAction.timestamp.desc())\
        .limit(limit)\
        .all()

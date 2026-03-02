"""Audit Log routes — real audit trail from decisions, alerts, and actions."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import datetime

import models
from database import get_db

router = APIRouter(prefix="/audit-log", tags=["audit-log"])


@router.get("")
def get_audit_log(
    limit: int = Query(200, ge=1, le=1000),
    action_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Build a unified audit trail from Decisions, Alerts, and AgencyActions.
    Returns a chronologically sorted list of entries.
    """
    entries = []

    # Pre-fetch all agency names to avoid N+1 queries
    all_agencies = db.query(models.Agency.id, models.Agency.name).all()
    agency_names = {a.id: a.name for a in all_agencies}


    # ── 1. Decision entries (band changes, credit actions) ──
    decisions_q = db.query(models.Decision).order_by(desc(models.Decision.decided_at)).limit(limit)
    for d in decisions_q:
        agency_name = agency_names.get(d.agency_id, d.agency_id)

        act = "Band Change" if d.band else "Credit Adjust"
        sev = "high" if d.band in ("BLOCKED", "RESTRICTED") else "medium" if d.band == "WARNING" else "low"
        detail = f"Score → {d.trust_score}, Band → {d.band}."
        if d.credit_action:
            detail += f" Credit action: {d.credit_action}."
        if d.top_signal_1:
            detail += f" Top signals: {d.top_signal_1}"
            if d.top_signal_2:
                detail += f", {d.top_signal_2}"
            detail += "."

        if action_type and action_type != act:
            continue
        if severity and severity != sev:
            continue

        entries.append({
            "id": f"dec-{d.id}",
            "timestamp": d.decided_at.isoformat() if d.decided_at else None,
            "user": "RiskSense AI" if not d.analyst_override else "Analyst Override",
            "action": act,
            "agencyId": d.agency_id,
            "agencyName": agency_name,
            "detail": detail,
            "severity": sev,
        })

    # ── 2. Alert entries (acknowledge / escalate) ──
    alerts_q = db.query(models.Alert).order_by(desc(models.Alert.created_at)).limit(limit)
    for a in alerts_q:
        agency_name = agency_names.get(a.agency_id, a.agency_id)

        if a.is_escalated:
            act = "Escalation"
            sev = "high"
        elif a.is_acknowledged:
            act = "Acknowledge"
            sev = "low"
        else:
            continue  # Unresolved alerts are not audit entries yet

        if action_type and action_type != act:
            continue
        if severity and severity != sev:
            continue

        entries.append({
            "id": f"alert-{a.id}",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "user": "Admin (Risk Officer)",
            "action": act,
            "agencyId": a.agency_id,
            "agencyName": agency_name,
            "detail": f"[{a.severity}] {a.message}",
            "severity": sev,
        })

    # ── 3. AgencyAction entries ──
    actions_q = db.query(models.AgencyAction).order_by(desc(models.AgencyAction.timestamp)).limit(limit)
    for ac in actions_q:
        agency_name = agency_names.get(ac.agency_id, ac.agency_id)

        act = "Setting Change"
        sev = "low"
        if ac.risk_indicator:
            act = "Override"
            sev = "medium"

        if action_type and action_type != act:
            continue
        if severity and severity != sev:
            continue

        entries.append({
            "id": f"action-{ac.id}",
            "timestamp": ac.timestamp.isoformat() if ac.timestamp else None,
            "user": "System",
            "action": act,
            "agencyId": ac.agency_id,
            "agencyName": agency_name,
            "detail": f"{ac.action_type}: {ac.category}" + (f" — {ac.risk_indicator}" if ac.risk_indicator else ""),
            "severity": sev,
        })

    # Sort all entries by timestamp descending
    entries.sort(key=lambda e: e["timestamp"] or "", reverse=True)
    return entries[:limit]

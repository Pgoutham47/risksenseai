"""Alert management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=List[schemas.AlertOut])
def list_alerts(severity: str = None, acknowledged: bool = None, db: Session = Depends(get_db)):
    q = db.query(models.Alert)
    if severity:
        q = q.filter(models.Alert.severity == severity)
    if acknowledged is not None:
        q = q.filter(models.Alert.is_acknowledged == acknowledged)
    return q.order_by(models.Alert.created_at.desc()).all()


@router.post("/alerts/{id}/acknowledge")
def ack_alert(id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_acknowledged = True
    db.commit()
    return {"status": "success"}


@router.post("/alerts/{id}/escalate")
def escalate_alert(id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_escalated = True
    db.commit()
    return {"status": "success"}

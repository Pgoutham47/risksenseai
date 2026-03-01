import uuid
import datetime
from sqlalchemy.orm import Session
import models

class AlertService:
    @staticmethod
    def trigger_alert(db: Session, agency_id: str, alert_type: str, severity: str, message: str, now: datetime.datetime = None, escalated: bool = None):
        """Creates and saves an alert to the database."""
        if now is None:
            now = datetime.datetime.utcnow()
            
        # Auto-escalate if severity is CRITICAL, unless explicitly overridden
        if escalated is None:
            escalated = (severity == "CRITICAL")

        alert = models.Alert(
            id=str(uuid.uuid4()),
            agency_id=agency_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            is_escalated=escalated,
            created_at=now
        )
        db.add(alert)
        return alert

    @staticmethod
    def evaluate_risk_and_alert(db: Session, agency: models.Agency, old_score: float, new_score: float, signals: dict, now: datetime.datetime = None):
        """Evaluates risk based on score changes and signals, then triggers alerts if necessary."""
        if now is None:
            now = datetime.datetime.utcnow()

        # 1. Massive Score Drop
        if old_score is not None and (old_score - new_score) >= 20:
            AlertService.trigger_alert(
                db, agency.id, "Massive Score Drop", "CRITICAL",
                f"Score dropped by {round(old_score - new_score)} points. Now at {round(new_score)}.",
                now
            )

        # 2. Critical Status / Block Approval
        if new_score < 15 and (old_score is None or old_score >= 15):
            AlertService.trigger_alert(
                db, agency.id, "Pending Block Approval", "CRITICAL",
                f"Trust score fell to {round(new_score)}, requiring manual admin approval for BLOCKED status.",
                now
            )
        elif new_score < 35 and (old_score is None or old_score >= 35):
            AlertService.trigger_alert(
                db, agency.id, "Agency Restricted", "WARNING",
                f"Trust score fell to {round(new_score)}, moving to RESTRICTED band.",
                now
            )

        # 3. Signal Threshold Breaches
        signal_thresholds = {
            'S1': ('High Booking Velocity', 'CRITICAL', 0.8),
            'S2': ('Refundable Ratio Spike', 'WARNING', 0.7),
            'S4': ('Cancellation Cascade', 'CRITICAL', 0.7),
            'S5': ('High Credit Utilization', 'WARNING', 0.9),
            'S8': ('Settlement Delay Elevated', 'WARNING', 0.7),
        }

        # Mapping signal keys to human names
        signal_names = {
            'S1': 'Booking Velocity',
            'S2': 'Refundable Ratio',
            'S4': 'Cancellation Cascade',
            'S5': 'Credit Utilization',
            'S8': 'Settlement Delay'
        }

        for sig_id, (alert_type, severity, threshold) in signal_thresholds.items():
            val = signals.get(sig_id, 0.0)
            if val >= threshold:
                # Check if we already have a recent unacknowledged alert of this type for this agency
                existing = db.query(models.Alert).filter(
                    models.Alert.agency_id == agency.id,
                    models.Alert.alert_type == alert_type,
                    models.Alert.is_acknowledged == False,
                    models.Alert.created_at >= now - datetime.timedelta(hours=6)
                ).first()
                
                if not existing:
                    AlertService.trigger_alert(
                        db, agency.id, alert_type, severity,
                        f"{signal_names[sig_id]} reached {round(val*100)}%, exceeding safety threshold of {round(threshold*100)}%.",
                        now
                    )

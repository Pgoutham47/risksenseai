from database import SessionLocal
from models import Agency, BookingEvent, Alert
from services.risk_orchestrator import RiskOrchestrator
import uuid
import datetime

def test_proactive_injection():
    db = SessionLocal()
    try:
        # 1. Pick an agency
        agency = db.query(Agency).first()
        if not agency:
            print("No agencies found in DB.")
            return
        
        print(f"Testing proactive injection for agency: {agency.name} ({agency.id})")
        print(f"Initial Score: {agency.current_trust_score}")
        
        # 2. Inject a high-risk 'Account Takeover' action (simplified as a burst of bookings)
        now = datetime.datetime.utcnow()
        for i in range(10):
            event = BookingEvent(
                id=str(uuid.uuid4()),
                agency_id=agency.id,
                event_type="booking",
                booking_ref=f"TEST-PRO-{i}",
                guest_name="Fraudster McGhee",
                destination_city="Suspicious City",
                booking_value=1200.0,
                is_refundable=True,
                checkin_date=now + datetime.timedelta(days=2),
                booking_date=now,
                timestamp=now
            )
            db.add(event)
        
        db.commit()
        print("Injected 10 suspicious bookings.")
        
        # 3. Trigger RiskOrchestrator
        RiskOrchestrator.recompute_and_alert(db, agency.id)
        
        # 4. Check results
        db.refresh(agency)
        print(f"New Score: {agency.current_trust_score}")
        print(f"New Band: {agency.current_band}")
        
        # Check alerts
        new_alerts = db.query(Alert).filter(
            Alert.agency_id == agency.id,
            Alert.created_at >= now
        ).all()
        
        print(f"New Alerts generated: {len(new_alerts)}")
        for alert in new_alerts:
            print(f"- [{alert.severity}] {alert.alert_type}: {alert.message}")
            if alert.is_escalated:
                print("  (IS ESCALATED)")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_proactive_injection()

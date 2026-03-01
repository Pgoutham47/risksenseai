import uuid
import datetime
import random
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Agency, BookingEvent, InvoicePayment, SignalScore, Decision
from signals import compute_all_signals, get_db_now
from scoring import compute_trust_score
from services.risk_orchestrator import RiskOrchestrator
from tbo_logger import logger

class TBOEventSimulator:
    def __init__(self):
        self.destinations = ["Delhi", "Mumbai", "Goa", "Bangalore", "Jaipur", "Chennai", "Hyderabad", "Kolkata", "NYC", "LHR", "DXB", "SIN"]
        self.names = ["Rahul", "Amit", "Priya", "Sneha", "Vikram", "Neha", "Rohan", "Siddharth", "Anjali", "Karan", "Pooja", "Arjun"]
        self.db = SessionLocal()

    def _clear_history(self, agency_id: str):
        self.db.query(BookingEvent).filter(BookingEvent.agency_id == agency_id).delete()
        self.db.query(InvoicePayment).filter(InvoicePayment.agency_id == agency_id).delete()
        self.db.query(SignalScore).filter(SignalScore.agency_id == agency_id).delete()
        self.db.query(Decision).filter(Decision.agency_id == agency_id).delete()
        self.db.commit()

    def simulate_normal_agency(self, agency_id: str, days=90):
        # 2-4 bookings per day, 15-25% refundable, 14-30 day lead time, good mix
        now = datetime.datetime.utcnow()
        for i in range(days):
            current_day = now - datetime.timedelta(days=(days - i))
            for _ in range(random.randint(2, 4)):
                self.db.add(BookingEvent(
                    id=str(uuid.uuid4()),
                    agency_id=agency_id,
                    event_type="booking",
                    booking_ref=f"BKN-{random.randint(10000, 99999)}",
                    guest_name=random.choice(self.names),
                    destination_city=random.choice(self.destinations),
                    booking_value=random.uniform(200.0, 1500.0),
                    is_refundable=random.random() < 0.20,
                    checkin_date=current_day + datetime.timedelta(days=random.randint(14, 30)),
                    booking_date=current_day,
                    timestamp=current_day
                ))
        self.db.commit()

    def simulate_account_takeover(self, agency_id: str):
        self.simulate_normal_agency(agency_id, days=89)
        now = datetime.datetime.utcnow()
        
        # Day 90: Sudden burst 25+ bookings in 2 hours. All refundable. Same 2 guests. Same 2 destinations.
        guests = random.sample(self.names, 2)
        dests = random.sample(self.destinations, 2)
        
        for _ in range(25):
            self.db.add(BookingEvent(
                id=str(uuid.uuid4()),
                agency_id=agency_id,
                event_type="booking",
                booking_ref=f"BKA-{random.randint(10000, 99999)}",
                guest_name=random.choice(guests),
                destination_city=random.choice(dests),
                booking_value=random.uniform(1000.0, 5000.0),
                is_refundable=True,
                checkin_date=now + datetime.timedelta(days=2),
                booking_date=now - datetime.timedelta(minutes=random.randint(1, 120)),
                timestamp=now - datetime.timedelta(minutes=random.randint(1, 120))
            ))
        self.db.commit()

    def simulate_chargeback_buildup(self, agency_id: str):
        # 0-60 normal
        self.simulate_normal_agency(agency_id, days=60)
        
        now = datetime.datetime.utcnow()
        base_date = now - datetime.timedelta(days=30)
        
        # Phase 1: Days 60-75 (Days ago 30 to 15)
        for i in range(15):
            current_day = base_date + datetime.timedelta(days=i)
            for _ in range(random.randint(3, 6)):
                self.db.add(BookingEvent(
                    id=str(uuid.uuid4()), agency_id=agency_id, event_type="booking",
                    booking_ref=f"BKC1-{random.randint(10000, 99999)}", guest_name=random.choice(self.names),
                    destination_city=random.choice(self.destinations), booking_value=random.uniform(500, 2000),
                    is_refundable=random.random() < 0.45,
                    checkin_date=current_day + datetime.timedelta(days=random.randint(7, 14)),
                    booking_date=current_day, timestamp=current_day
                ))
        
        # Phase 2: Days 75-88 (Days ago 15 to 2)
        phase2_start = now - datetime.timedelta(days=15)
        for i in range(13):
            current_day = phase2_start + datetime.timedelta(days=i)
            # Velocity 3-5x normal
            for _ in range(random.randint(8, 15)):
                self.db.add(BookingEvent(
                    id=str(uuid.uuid4()), agency_id=agency_id, event_type="booking",
                    booking_ref=f"BKC2-{random.randint(10000, 99999)}", guest_name=random.choice(self.names),
                    destination_city=random.choice(self.destinations), booking_value=random.uniform(800, 3000),
                    is_refundable=random.random() < 0.78,
                    checkin_date=current_day + datetime.timedelta(days=random.randint(2, 7)),
                    booking_date=current_day, timestamp=current_day
                ))
            
        # Agency state update
        agency = self.db.query(Agency).filter(Agency.id == agency_id).first()
        if agency:
            agency.outstanding_balance = agency.credit_limit * 0.87
        self.db.commit()
            
    def simulate_credit_default(self, agency_id: str):
        self.simulate_normal_agency(agency_id, days=90)
        now = datetime.datetime.utcnow()
        
        # Invoices logic
        self.db.add(InvoicePayment(
            id=str(uuid.uuid4()), agency_id=agency_id, invoice_ref="INV-01",
            due_date=now - datetime.timedelta(days=60), paid_date=now - datetime.timedelta(days=58), amount=10000, days_late=2
        ))
        self.db.add(InvoicePayment(
            id=str(uuid.uuid4()), agency_id=agency_id, invoice_ref="INV-02",
            due_date=now - datetime.timedelta(days=30), paid_date=now - datetime.timedelta(days=22), amount=15000, days_late=8
        ))
        self.db.add(InvoicePayment(
            id=str(uuid.uuid4()), agency_id=agency_id, invoice_ref="INV-03",
            due_date=now - datetime.timedelta(days=10), paid_date=None, amount=30000, days_late=10
        ))
        
        agency = self.db.query(Agency).filter(Agency.id == agency_id).first()
        if agency:
            agency.outstanding_balance = agency.credit_limit * 0.98
        self.db.commit()

    def simulate_inventory_blocking(self, agency_id: str):
        self.simulate_normal_agency(agency_id, days=85)
        now = datetime.datetime.utcnow()
        
        # Days 86-90: Blocks and Cancels
        for i in range(5):
            current_day = now - datetime.timedelta(days=(4-i))
            # 15 rooms at same hotel
            target_dest = random.choice(self.destinations)
            for j in range(15):
                ref = f"BKIB-{current_day.strftime('%H%d')}-{j}"
                bk_time = current_day - datetime.timedelta(minutes=j*2)
                self.db.add(BookingEvent(
                    id=str(uuid.uuid4()), agency_id=agency_id, event_type="booking", booking_ref=ref,
                    guest_name=random.choice(self.names), destination_city=target_dest, booking_value=300.0,
                    is_refundable=True, checkin_date=current_day + datetime.timedelta(days=8),
                    booking_date=bk_time, timestamp=bk_time
                ))
            # Cancel 12 of them
            for j in range(12):
                ref = f"BKIB-{current_day.strftime('%H%d')}-{j}"
                c_time = current_day + datetime.timedelta(hours=random.randint(3, 5))
                self.db.add(BookingEvent(
                    id=str(uuid.uuid4()), agency_id=agency_id, event_type="cancellation", booking_ref=ref,
                    guest_name=random.choice(self.names), destination_city=target_dest, booking_value=-300.0,
                    is_refundable=True, checkin_date=current_day + datetime.timedelta(days=8),
                    booking_date=current_day - datetime.timedelta(minutes=j*2), timestamp=c_time
                ))
        self.db.commit()

    def run_demo_scenario(self, scenario_name: str, agency_id: str):
        logger.info(f"Running scenario '{scenario_name}' for agency '{agency_id}'")
        self._clear_history(agency_id)
        
        if scenario_name == 'account_takeover':
            self.simulate_account_takeover(agency_id)
        elif scenario_name == 'chargeback':
            self.simulate_chargeback_buildup(agency_id)
        elif scenario_name == 'credit_default':
            self.simulate_credit_default(agency_id)
        elif scenario_name == 'inventory_blocking':
            self.simulate_inventory_blocking(agency_id)
        else: # normal
            self.simulate_normal_agency(agency_id)
            
        # Recompute using centralized Orchestrator
        res = RiskOrchestrator.recompute_and_alert(self.db, agency_id)
        return {"trust_score": res["new_score"], "band": res["new_band"]}
        
    def close(self):
        self.db.close()

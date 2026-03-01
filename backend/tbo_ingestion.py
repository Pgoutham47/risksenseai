import uuid
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Agency, BookingEvent, Alert
from tbo_client import TBOClient, TBOConnectionError
from tbo_flight_client import TBOFlightClient
from tbo_parser import parse_hotel_search_response, parse_booking_detail_response, parse_cancellation_response, parse_flight_search_response
from services.risk_orchestrator import RiskOrchestrator
from tbo_logger import logger

class TBOIngestionService:
    def __init__(self, use_dummy=False):
        self.client = TBOClient(use_dummy=use_dummy)
        self.flight_client = TBOFlightClient()
        
        # Target cities for simulation
        self.cities = [130443, 128905, 112908]
        
        # Flight routes for simulation
        self.flight_routes = [("DEL", "BOM"), ("DEL", "DXB"), ("BOM", "LHR")]

    def run_full_ingestion_cycle(self, quick=False):
        logger.info(f"Starting TBO full ingestion cycle (Quick: {quick}).")
        db = SessionLocal()
        total_events_written = 0
        try:
            agencies = db.query(Agency).all()
            if quick and agencies:
                agencies = [agencies[0]]
            for agency in agencies:
                try:
                    events = self.poll_agency_events(agency.id)
                    written = self.write_events_to_db(db, events)
                    self.mark_cycle_complete(db, agency, written)
                    if written > 0:
                        RiskOrchestrator.recompute_and_alert(db, agency.id)
                    total_events_written += written
                except Exception as e:
                    logger.error(f"Error polling agency {agency.id}: {e}")
                    # Could record to TBOApiError table here
            logger.info(f"Cycle complete. Total events written: {total_events_written}")
        finally:
            db.close()
            
        return total_events_written

    def poll_agency_events(self, agency_id: str) -> list[dict]:
        events = []
        now = datetime.datetime.utcnow()
        checkin_date = (now + datetime.timedelta(days=14)).strftime("%Y-%m-%d")
        checkout_date = (now + datetime.timedelta(days=16)).strftime("%Y-%m-%d")
        
        # 1. Fetch Hotel Events
        for city in self.cities:
            try:
                raw_xml = self.client.hotel_search(str(city), checkin_date, checkout_date)
                parsed_events = parse_hotel_search_response(raw_xml, agency_id)
                events.extend(parsed_events)
            except Exception as e:
                logger.error(f"Failed hotel search for city {city}: {e}")
                
        # 2. Fetch Flight Events
        for origin, dest in self.flight_routes:
            try:
                flight_json = self.flight_client.search_flights(origin=origin, destination=dest)
                parsed_events = parse_flight_search_response(flight_json, agency_id)
                events.extend(parsed_events)
            except Exception as e:
                logger.error(f"Failed flight search for route {origin}-{dest}: {e}")
                
        # In a real system, we'd query TBO for booking lists. Simulator will take over from here.
        return events

    def write_events_to_db(self, db: Session, events: list[dict]) -> int:
        written = 0
        for e in events:
            # Deduplication
            if e.get("booking_ref"):
                exists = db.query(BookingEvent).filter(
                    BookingEvent.booking_ref == e["booking_ref"],
                    BookingEvent.event_type == e["event_type"]
                ).first()
                if exists:
                    continue
                    
            event_record = BookingEvent(
                id=str(uuid.uuid4()),
                agency_id=e["agency_id"],
                event_type=e["event_type"],
                booking_ref=e.get("booking_ref"),
                guest_name=e.get("guest_names", [""])[0] if isinstance(e.get("guest_names"), list) and e.get("guest_names") else e.get("guest_names"),
                destination_city=e.get("destination_city"),
                booking_value=e.get("booking_value", 0.0),
                is_refundable=e.get("is_refundable", False),
                checkin_date=datetime.datetime.fromisoformat(e["checkin_date"]) if e.get("checkin_date") else None,
                booking_date=datetime.datetime.fromisoformat(e["booking_date"]) if e.get("booking_date") else None,
                timestamp=datetime.datetime.fromisoformat(e["timestamp"]) if e.get("timestamp") else datetime.datetime.utcnow()
            )
            db.add(event_record)
            written += 1
            logger.info(f"Written {e['event_type']} event for agency {e['agency_id']} to DB.")
        
        if written > 0:
            db.commit()
            
        return written

    def get_last_poll_timestamp(self, db: Session, agency_id: str) -> datetime.datetime:
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if agency and agency.last_synced_at:
            return agency.last_synced_at
        return datetime.datetime.utcnow() - datetime.timedelta(hours=24)

    def mark_cycle_complete(self, db: Session, agency: Agency, events_written: int):
        agency.last_synced_at = datetime.datetime.utcnow()
        db.commit()
        logger.info(f"Marked sync complete for {agency.id}. {events_written} events ingested.")

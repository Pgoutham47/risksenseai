import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import TBOApiError, BookingEvent, Agency
from tbo_client import TBOClient

class TBOHealthChecker:
    def __init__(self):
        self.client = TBOClient(use_dummy=False)

    def check_api_connectivity(self) -> dict:
        start = datetime.datetime.now()
        try:
            # We ping the HotelSearch API with a dummy check just to see if the server responds
            now = datetime.datetime.utcnow()
            checkin = (now + datetime.timedelta(days=14)).strftime("%Y-%m-%d")
            checkout = (now + datetime.timedelta(days=16)).strftime("%Y-%m-%d")
            self.client.hotel_search("130443", checkin, checkout)
            latency = int((datetime.datetime.now() - start).total_seconds() * 1000)
            return {
                "status": "connected" if latency < 5000 else "degraded",
                "response_time_ms": latency,
                "last_checked": datetime.datetime.utcnow().isoformat(),
                "error": None
            }
        except Exception as e:
            return {
                "status": "down",
                "response_time_ms": int((datetime.datetime.now() - start).total_seconds() * 1000),
                "last_checked": datetime.datetime.utcnow().isoformat(),
                "error": str(e)
            }

    def check_credentials_valid(self) -> dict:
        # Assuming identical to connectivity check but parsed explicitly for auth errors
        res = self.check_api_connectivity()
        if res["status"] in ["connected", "degraded"]:
            return {"valid": True, "reason": "Successfully reached API."}
        elif res["error"] and ("401" in res["error"] or "403" in res["error"]):
            return {"valid": False, "reason": f"Auth Failure: {res['error']}"}
        return {"valid": False, "reason": res["error"]}

    def get_health_report(self) -> dict:
        db = SessionLocal()
        try:
            conn = self.check_api_connectivity()
            creds = self.check_credentials_valid()
            
            # Events in last hour
            hour_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
            recent_events = db.query(BookingEvent).filter(BookingEvent.timestamp >= hour_ago).count()
            
            # Failed polls in last 24h
            day_ago = datetime.datetime.utcnow() - datetime.timedelta(days=1)
            failed_polls = db.query(TBOApiError).filter(TBOApiError.timestamp >= day_ago).count()
            
            # Last successful ingestion
            # Take the max last_synced_at from all agencies
            last_sync_res = db.query(Agency.last_synced_at).order_by(Agency.last_synced_at.desc()).first()
            last_sync = last_sync_res[0].isoformat() if last_sync_res and last_sync_res[0] else None

            return {
                "api_connectivity": conn,
                "credentials_valid": creds,
                "last_successful_ingestion": last_sync,
                "events_ingested_last_hour": recent_events,
                "failed_polls_last_24h": failed_polls
            }
        finally:
            db.close()

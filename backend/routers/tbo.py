"""TBO API integration routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from tbo_health import TBOHealthChecker
from tbo_ingestion import TBOIngestionService
from tbo_simulator import TBOEventSimulator

router = APIRouter(prefix="/tbo", tags=["tbo"])


@router.get("/health")
def tbo_health():
    checker = TBOHealthChecker()
    return checker.get_health_report()


@router.get("/test-connection")
def tbo_test_connection():
    checker = TBOHealthChecker()
    res = checker.check_api_connectivity()
    return {"status": res["status"], "latency": res["response_time_ms"]}


@router.post("/run-ingestion")
def tbo_run_ingestion(quick: bool = False):
    svc = TBOIngestionService(use_dummy=False)
    written = svc.run_full_ingestion_cycle(quick=quick)
    return {"status": "success", "events_written": written}


@router.post("/simulate")
def tbo_simulate(req: schemas.TBOSimulateRequest):
    sim = TBOEventSimulator()
    try:
        res = sim.run_demo_scenario(req.scenario, req.agency_id)
        return {"status": "success", "new_trust_score": res["trust_score"], "new_band": res["band"]}
    finally:
        sim.close()


@router.get("/last-sync")
def tbo_last_sync(db: Session = Depends(get_db)):
    agencies = db.query(models.Agency.id, models.Agency.last_synced_at).all()
    res = {a[0]: a[1].isoformat() if a[1] else None for a in agencies}
    return res


@router.get("/flight-search")
def tbo_flight_search_raw():
    """Fetches a raw payload from the TBO Flight Search API for the monitoring page."""
    from tbo_flight_client import TBOFlightClient
    try:
        client = TBOFlightClient()
        original = client.timeout
        client.timeout = 30 # Increased to 30 to allow TBO UAT enough time to respond
        res = client.search_flights()
        client.timeout = original

        is_mock = res.get("Response", {}).get("TraceId") == "mock-trace-1234"
        return {
            "status": "success",
            "source": "simulator" if is_mock else "live_uat",
            "data": res,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

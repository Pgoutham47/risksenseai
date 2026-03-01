from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from database import SessionLocal
from tbo_ingestion import TBOIngestionService
from services.risk_orchestrator import RiskOrchestrator
from tbo_logger import logger

def job_data_ingestion():
    logger.info("Running Data Ingestion Job via TBO Integration...")
    svc = TBOIngestionService(use_dummy=False)
    try:
        svc.run_full_ingestion_cycle()
    except Exception as e:
        logger.error(f"Error in TBO data ingestion: {e}")

def job_risk_recomputation():
    """Periodic job to recompute all trust scores and evaluate alerts."""
    logger.info(f"[{datetime.datetime.now()}] Running Risk Recomputation Job...")
    db = SessionLocal()
    try:
        RiskOrchestrator.recompute_all(db)
    except Exception as e:
        logger.error(f"Error in scheduled risk recomputation: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Job 1: Every 15 min
    scheduler.add_job(job_data_ingestion, 'interval', minutes=15)
    # Job 2: Every 15 min, offset by 5 min
    scheduler.add_job(job_risk_recomputation, 'interval', minutes=15, next_run_time=datetime.datetime.now() + datetime.timedelta(minutes=5))
    scheduler.start()
    logger.info("Background scheduler started.")

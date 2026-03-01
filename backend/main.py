"""
RiskSense AI API — Fraud Detection & Credit Risk Intelligence Platform.

Application entry point. All route handlers are organised into focused
router modules under the `routers/` package.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

import models
import seed_data
from database import engine, get_db, Base
from scheduler import start_scheduler

from routers import agencies, dashboard, alerts, analytics, tbo, llm, admin, simulator, audit_log, investigate

# Create tables
models.Base.metadata.create_all(bind=engine)

logger = logging.getLogger("risksense")

app = FastAPI(
    title="RiskSense AI API",
    description="Fraud Detection & Credit Risk Intelligence Platform",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# ── Startup ──
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    if not db.query(models.Agency).first():
        print("Database empty. Running seed...")
        seed_data.seed_db(db)

    start_scheduler()


# ── Register Routers ──
app.include_router(agencies.router)
app.include_router(simulator.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(tbo.router)
app.include_router(llm.router)
app.include_router(admin.router)
app.include_router(audit_log.router)
app.include_router(investigate.router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

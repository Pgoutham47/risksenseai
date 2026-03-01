# RiskSense AI Backend

FastAPI backend for the RiskSense AI — Fraud Detection & Credit Risk Intelligence Platform.

## Features Built
- **8 Mathematical Signals**: Booking Velocity, Refundable Ratio, Lead Time Compression, Cancellation Cascade, Credit Utilization, Name Reuse, Destination Spikes, Settlement Delay.
- **Trust Score Engine**: Calculating global risk with amplifier models and tenure adjustments.
- **Background Scheduler**: Running with `APScheduler` for concurrent data ingestion and bulk model recomputation.
- **SQLite + SQLAlchemy**: Configured with WAL mode to support background process queries.

## Setup Instructions

1. Ensure you have Python 3.10+ installed.
2. Initialize virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Run the development server (auto-seeds database on first launch):
```bash
python main.py
```

4. The server will start on `http://localhost:8000`.
5. Access the auto-generated Swagger UI docs at `http://localhost:8000/docs`.

29: ## Integration
30: To connect your React Frontend (Risk Pulse Console), change your base API URL in your queries to point to `http://localhost:8000`. The implemented endpoints exactly mirror your Data UI needs (Dashboard, Agency Profiles, Risk Signals, Analytics, Simulator Engine triggers, etc).
31: 
32: ## TBO Integration Setup & Demo Scenarios
33: RiskSense AI connects directly to Travel Boutique Online's SOAP API to ingest real-time booking events and detect anomalies dynamically.
34: 
35: 1. **Setup Credentials**: TBO API credentials should be stored in the root `.env` file containing `TBO_STAGING_URL`, `TBO_USERNAME`, and `TBO_PASSWORD`.
36: 2. **Data Ingestion**: The scheduler runs every 15 minutes to automatically poll the TBO endpoints natively via XML/SOAP. It parses and deduplicates new hotel bookings or cancellations, mapping them into the RiskSense Trust Engine.
37: 3. **Demo Scenarios**: To effectively validate the detection rules, you can invoke the robust TBO Event Simulator. Hit `POST /tbo/simulate` with a given `scenario`:
38:   - `normal` - Clean 90-day booking history.
39:   - `account_takeover` - Massive booking surge on Day 90 triggering Velocity + Dest Spikes.
40:   - `chargeback` - Gradual buildup of refundable ratio + velocity.
41:   - `credit_default` - Consistent pattern of missed invoices and maxed out utilization.
42:   - `inventory_blocking` - Systemic 48-hour cycles of booking identical hotels and cancelling them in hours.
43:   
44: All simulations wipe existing events, insert hundreds of specific mock parameters tailored exactly for RiskSense's math models, and automatically invoke a Trust Engine recompute to alter the agency's band and score!

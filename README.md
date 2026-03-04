<p align="center">
  <h1 align="center">RiskSense AI</h1>
  <p align="center">
    <strong>AI-Powered Fraud Detection & Credit Risk Intelligence Platform</strong>
  </p>
  <p align="center">
    Real-time travel agency risk monitoring with Bayesian scoring, multi-signal fraud detection, and dynamic credit management.
  </p>
</p>

---

## Overview

RiskSense AI is an intelligent risk management platform designed for B2B travel platforms. It continuously monitors travel agency behavior across **8 mathematical risk signals**, calculates personalized **Bayesian Trust Scores**, and applies graduated **3-level containment** (Session → User → Agency) to detect and prevent fraud before it impacts the business.

### Key Capabilities

- **Real-Time Dashboard** — Live risk monitoring with KPI cards, band distribution charts, heatmaps, and an event feed
- **8-Signal Fraud Detection** — Booking velocity, refundable ratio, lead time compression, cancellation cascades, credit utilization, passenger name reuse, destination spikes, and settlement delay
- **Bayesian Trust Engine** — Per-agency personalized signal weights that adapt based on historical outcomes
- **3-Phase Chargeback Detection** — Identifies chargeback fraud up to 21 days before it crystallizes
- **Dynamic Credit Ladder** — Automated credit contraction and expansion based on risk trajectory
- **Agency Profiles** — Deep-dive views with score history, signal breakdowns, and decision logs
- **TBO API Integration** — Live data ingestion from Travel Boutique Online's SOAP API
- **Fraud Simulator** — Run account takeover, chargeback, credit default, and inventory blocking scenarios
- **AI Investigation Assistant** — LLM-powered risk analysis and narrative generation
- **Audit Trail** — Full logging of every risk decision, override, and escalation

---

## Tech Stack

| Layer        | Technology                                                    |
|-------------|---------------------------------------------------------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| **Backend**  | Python, FastAPI, SQLAlchemy, APScheduler                      |
| **Database** | SQLite (WAL mode) — auto-seeded on first launch               |
| **AI/ML**    | OpenAI GPT (investigation narratives), Bayesian scoring engine |
| **APIs**     | TBO Hotel & Flight SOAP APIs, Supabase (auth)                 |

---

## Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.10

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Pgoutham47/risksenseai.git
cd risksenseai
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Start the server (auto-seeds database on first launch)
python main.py
```

The API will be available at `http://localhost:8000`.  
Swagger docs are at `http://localhost:8000/docs`.

---

## Environment Variables

### Frontend (`.env`)

| Variable                 | Description                        |
|-------------------------|------------------------------------|
| `VITE_API_BASE`         | Backend API URL (default: `http://localhost:8000`) |
| `VITE_SUPABASE_URL`    | Supabase project URL               |
| `VITE_SUPABASE_ANON_KEY`| Supabase anonymous key             |

### Backend (`backend/.env`)

| Variable              | Description                              |
|----------------------|------------------------------------------|
| `TBO_STAGING_URL`    | TBO Hotel API staging endpoint           |
| `TBO_USERNAME`       | TBO API username                         |
| `TBO_PASSWORD`       | TBO API password                         |
| `TBO_FLIGHT_URL`     | TBO Flight shared data endpoint          |
| `TBO_FLIGHT_SEARCH_URL` | TBO Flight search endpoint            |
| `TBO_FLIGHT_USERNAME`| TBO Flight API username                  |
| `TBO_FLIGHT_PASSWORD`| TBO Flight API password                  |
| `OPENAI_API_KEY`     | OpenAI API key for investigation engine  |
| `SUPABASE_URL`       | Supabase project URL                     |
| `SUPABASE_ANON_KEY`  | Supabase anonymous key                   |
| `DATABASE_URL`       | PostgreSQL connection string (optional)  |

> **Note:** Never commit `.env` files. Both are listed in `.gitignore`.

---

## Project Structure

```
risksenseai/
├── src/                        # React frontend
│   ├── components/             #   UI components (shadcn + custom)
│   ├── contexts/               #   React context providers (DataContext)
│   ├── hooks/                  #   Custom React hooks
│   ├── lib/                    #   API client, utilities
│   ├── pages/                  #   Route pages (Dashboard, AgencyProfile, etc.)
│   └── data/                   #   Shared types and helpers
├── backend/                    # FastAPI backend
│   ├── main.py                 #   Application entry point
│   ├── models.py               #   SQLAlchemy ORM models
│   ├── schemas.py              #   Pydantic request/response schemas
│   ├── database.py             #   Database engine configuration
│   ├── seed_data.py            #   Initial data seeding
│   ├── bayesian_scoring.py     #   Bayesian trust score engine
│   ├── scoring.py              #   Signal scoring calculations
│   ├── signals.py              #   8 risk signal definitions
│   ├── credit_ladder.py        #   Dynamic credit management
│   ├── containment.py          #   3-level containment logic
│   ├── chargeback_detector.py  #   3-phase chargeback detection
│   ├── outcome_processor.py    #   Outcome-based weight updates
│   ├── scheduler.py            #   APScheduler background tasks
│   ├── routers/                #   API route handlers
│   │   ├── dashboard.py        #     Dashboard metrics
│   │   ├── agencies.py         #     Agency CRUD & profiles
│   │   ├── alerts.py           #     Alert management
│   │   ├── analytics.py        #     Analytics endpoints
│   │   ├── simulator.py        #     Fraud simulation
│   │   ├── investigate.py      #     AI investigation
│   │   ├── audit_log.py        #     Audit trail
│   │   ├── tbo.py              #     TBO API integration
│   │   ├── llm.py              #     LLM endpoints
│   │   └── admin.py            #     Admin operations
│   └── services/               #   Business logic services
│       ├── risk_orchestrator.py #     Core risk orchestration
│       ├── simulation_engine.py #     Scenario simulation engine
│       └── alert_service.py    #     Alert generation service
├── public/                     # Static assets
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── vercel.json                 # Vercel deployment config
```

---

## Simulation Scenarios

The built-in fraud simulator lets you test the detection engine with realistic scenarios. Trigger via the Simulator page or the API:

```bash
POST /tbo/simulate
```

| Scenario             | Description                                                             |
|---------------------|-------------------------------------------------------------------------|
| `normal`            | Clean 90-day booking history — baseline behavior                        |
| `account_takeover`  | Massive booking surge triggering velocity + destination spike signals   |
| `chargeback`        | Gradual refundable ratio buildup simulating planned chargeback fraud    |
| `credit_default`    | Missed invoices and maxed utilization simulating credit deterioration   |
| `inventory_blocking`| Systematic book-and-cancel cycles blocking competitor inventory         |

Each simulation resets agency events, injects scenario-specific data, and triggers a full Trust Engine recomputation.

---

## Available Scripts

### Frontend

| Command           | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start development server       |
| `npm run build`  | Build for production           |
| `npm run preview`| Preview production build       |
| `npm run lint`   | Run ESLint                     |
| `npm run test`   | Run tests with Vitest          |

### Backend

| Command           | Description                    |
|------------------|--------------------------------|
| `python main.py` | Start the API server           |

---

## API Documentation

Once the backend is running, interactive API documentation is available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## License

This project is proprietary. All rights reserved.

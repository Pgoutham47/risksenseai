"""
Seed data for RiskSense AI — Bayesian Weight Evolution Engine.
Uses the canonical 5-agency dataset from agency_profiles.js.

Each agency demonstrates a different fraud/risk scenario:
  1. PearlVoyages — Established, always clean. S2 noise, S8 dominant.
  2. AlphaJet Travel — Account takeover on Day 26. S1+S6 reliable.
  3. TravelMate India — Slow credit default. S5+S8 dominant.
  4. FastTrack Holidays — Inventory blocking. S4 dominant.
  5. SkyTravel Pvt Ltd — Pre-planned chargeback. 3-phase arc.
"""

import uuid
import datetime
import random
from models import (
    Agency, BookingEvent, InvoicePayment, SignalScore,
    SignalOutcome, WeightProfile, AgencyAction, Base
)
from database import engine, SessionLocal

SIGNAL_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']

PLATFORM_PRIOR = {
    'S1': 0.22, 'S2': 0.20, 'S3': 0.12, 'S4': 0.08,
    'S5': 0.16, 'S6': 0.04, 'S7': 0.04, 'S8': 0.14,
}


def _compute_f1(tp, fp, tn, fn):
    if tp == 0 and fp == 0:
        return 0.5
    if tp == 0:
        return 0.5
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    if precision + recall == 0:
        return 0.0
    return 2 * (precision * recall) / (precision + recall)


# ═══ Canonical Agency Definitions ═══

AGENCIES = [
    {
        "id": "AGY-001",
        "name": "PearlVoyages Ltd",
        "cohort_group": "Large",
        "destination_profile": "International",
        "tenure_days": 30,
        "credit_limit": 1000000,
        "outstanding_balance": 0,
        "trust_score": 87,
        "band": "CLEAR",
        "city": "Mumbai",
        "description": "Newly onboarded luxury travel agency. International leisure focus.",
    },
    {
        "id": "AGY-002",
        "name": "AlphaJet Travel",
        "cohort_group": "Medium",
        "destination_profile": "Mixed",
        "tenure_days": 30,
        "credit_limit": 1000000,
        "outstanding_balance": 0,
        "trust_score": 74,
        "band": "CAUTION",
        "city": "Delhi",
        "description": "Newly onboarded mid-size agency. Mixed domestic and international routes.",
    },
    {
        "id": "AGY-003",
        "name": "TravelMate India",
        "cohort_group": "Small",
        "destination_profile": "Domestic",
        "tenure_days": 30,
        "credit_limit": 1000000,
        "outstanding_balance": 0,
        "trust_score": 14,
        "band": "BLOCKED",
        "city": "Jaipur",
        "description": "Newly onboarded small domestic agency. Rajasthan tourism specialist.",
    },
    {
        "id": "AGY-004",
        "name": "FastTrack Holidays",
        "cohort_group": "Medium",
        "destination_profile": "Mixed",
        "tenure_days": 30,
        "credit_limit": 1000000,
        "outstanding_balance": 0,
        "trust_score": 28,
        "band": "RESTRICTED",
        "city": "Pune",
        "description": "Newly onboarded mid-size agency. Corporate and leisure bookings.",
    },
    {
        "id": "AGY-005",
        "name": "SkyTravel Pvt Ltd",
        "cohort_group": "Small",
        "destination_profile": "Domestic",
        "tenure_days": 30,
        "credit_limit": 1000000,
        "outstanding_balance": 0,
        "trust_score": 4,
        "band": "BLOCKED",
        "city": "Bangalore",
        "description": "Newly onboarded small agency. South India domestic routes.",
    },
]


# ═══ Weight Profiles (from agency_profiles.js) ═══

WEIGHT_PROFILES = {
    "AGY-001": {
        "learning_rate": 0.50,
        "observations": 134,
        "previous_score": 87,
        "signals": {
            "S1": {"prior": 0.22, "current": 0.18, "reliability": 0.61, "tp": 1, "fp": 2, "tn": 28, "fn": 0},
            "S2": {"prior": 0.20, "current": 0.06, "reliability": 0.08, "tp": 0, "fp": 6, "tn": 22, "fn": 0},
            "S3": {"prior": 0.12, "current": 0.08, "reliability": 0.40, "tp": 0, "fp": 3, "tn": 18, "fn": 0},
            "S4": {"prior": 0.08, "current": 0.08, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 12, "fn": 0},
            "S5": {"prior": 0.16, "current": 0.14, "reliability": 0.55, "tp": 1, "fp": 1, "tn": 24, "fn": 0},
            "S6": {"prior": 0.04, "current": 0.03, "reliability": 0.20, "tp": 0, "fp": 2, "tn": 14, "fn": 0},
            "S7": {"prior": 0.04, "current": 0.04, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 10, "fn": 0},
            "S8": {"prior": 0.14, "current": 0.39, "reliability": 0.97, "tp": 8, "fp": 0, "tn": 31, "fn": 0},
        },
    },
    "AGY-002": {
        "learning_rate": 0.50,
        "observations": 112,
        "previous_score": 74,
        "signals": {
            "S1": {"prior": 0.22, "current": 0.51, "reliability": 0.92, "tp": 6, "fp": 1, "tn": 34, "fn": 0},
            "S2": {"prior": 0.20, "current": 0.11, "reliability": 0.29, "tp": 1, "fp": 4, "tn": 28, "fn": 0},
            "S3": {"prior": 0.12, "current": 0.07, "reliability": 0.18, "tp": 0, "fp": 3, "tn": 22, "fn": 0},
            "S4": {"prior": 0.08, "current": 0.08, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 14, "fn": 0},
            "S5": {"prior": 0.16, "current": 0.19, "reliability": 0.57, "tp": 2, "fp": 2, "tn": 18, "fn": 1},
            "S6": {"prior": 0.04, "current": 0.09, "reliability": 0.86, "tp": 3, "fp": 1, "tn": 16, "fn": 0},
            "S7": {"prior": 0.04, "current": 0.03, "reliability": 0.00, "tp": 0, "fp": 1, "tn": 12, "fn": 0},
            "S8": {"prior": 0.14, "current": 0.31, "reliability": 0.88, "tp": 4, "fp": 0, "tn": 22, "fn": 1},
        },
    },
    "AGY-003": {
        "learning_rate": 0.44,
        "observations": 88,
        "previous_score": 14,
        "signals": {
            "S1": {"prior": 0.22, "current": 0.15, "reliability": 0.38, "tp": 1, "fp": 3, "tn": 18, "fn": 0},
            "S2": {"prior": 0.20, "current": 0.14, "reliability": 0.31, "tp": 0, "fp": 4, "tn": 14, "fn": 0},
            "S3": {"prior": 0.12, "current": 0.08, "reliability": 0.22, "tp": 0, "fp": 2, "tn": 12, "fn": 0},
            "S4": {"prior": 0.08, "current": 0.08, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 8, "fn": 0},
            "S5": {"prior": 0.16, "current": 0.28, "reliability": 0.84, "tp": 5, "fp": 1, "tn": 12, "fn": 1},
            "S6": {"prior": 0.04, "current": 0.04, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 8, "fn": 0},
            "S7": {"prior": 0.04, "current": 0.04, "reliability": 0.50, "tp": 0, "fp": 0, "tn": 8, "fn": 0},
            "S8": {"prior": 0.14, "current": 0.42, "reliability": 0.94, "tp": 7, "fp": 0, "tn": 14, "fn": 1},
        },
    },
    "AGY-004": {
        "learning_rate": 0.50,
        "observations": 102,
        "previous_score": 28,
        "signals": {
            "S1": {"prior": 0.22, "current": 0.18, "reliability": 0.44, "tp": 2, "fp": 3, "tn": 22, "fn": 0},
            "S2": {"prior": 0.20, "current": 0.16, "reliability": 0.38, "tp": 1, "fp": 3, "tn": 20, "fn": 0},
            "S3": {"prior": 0.12, "current": 0.10, "reliability": 0.35, "tp": 0, "fp": 2, "tn": 16, "fn": 0},
            "S4": {"prior": 0.08, "current": 0.44, "reliability": 0.95, "tp": 8, "fp": 0, "tn": 14, "fn": 1},
            "S5": {"prior": 0.16, "current": 0.07, "reliability": 0.18, "tp": 0, "fp": 2, "tn": 20, "fn": 0},
            "S6": {"prior": 0.04, "current": 0.03, "reliability": 0.20, "tp": 0, "fp": 1, "tn": 12, "fn": 0},
            "S7": {"prior": 0.04, "current": 0.08, "reliability": 0.72, "tp": 4, "fp": 1, "tn": 10, "fn": 1},
            "S8": {"prior": 0.14, "current": 0.06, "reliability": 0.12, "tp": 0, "fp": 2, "tn": 22, "fn": 0},
        },
    },
    "AGY-005": {
        "learning_rate": 0.44,
        "observations": 88,
        "previous_score": 4,
        "signals": {
            "S1": {"prior": 0.22, "current": 0.34, "reliability": 0.78, "tp": 4, "fp": 1, "tn": 18, "fn": 0},
            "S2": {"prior": 0.20, "current": 0.29, "reliability": 0.81, "tp": 5, "fp": 1, "tn": 14, "fn": 1},
            "S3": {"prior": 0.12, "current": 0.17, "reliability": 0.69, "tp": 3, "fp": 1, "tn": 12, "fn": 0},
            "S4": {"prior": 0.08, "current": 0.07, "reliability": 0.44, "tp": 0, "fp": 1, "tn": 8, "fn": 0},
            "S5": {"prior": 0.16, "current": 0.22, "reliability": 0.74, "tp": 4, "fp": 1, "tn": 12, "fn": 1},
            "S6": {"prior": 0.04, "current": 0.06, "reliability": 0.71, "tp": 2, "fp": 0, "tn": 8, "fn": 1},
            "S7": {"prior": 0.04, "current": 0.05, "reliability": 0.60, "tp": 1, "fp": 0, "tn": 8, "fn": 1},
            "S8": {"prior": 0.14, "current": 0.12, "reliability": 0.41, "tp": 1, "fp": 2, "tn": 10, "fn": 0},
        },
    },
}


# ═══ Events from agency_profiles.js ═══

def _booking(day, value, refundable, destination, guest, lead_days, now, agency_id):
    return BookingEvent(
        id=str(uuid.uuid4()),
        agency_id=agency_id,
        event_type="booking",
        booking_ref=f"BK-{random.randint(10000,99999)}",
        guest_name=guest,
        destination_city=destination,
        booking_value=float(value),
        is_refundable=refundable,
        checkin_date=now + datetime.timedelta(days=lead_days),
        booking_date=now - datetime.timedelta(days=30 - day),
        timestamp=now - datetime.timedelta(days=30 - day),
    )

def _cancellation(day, booking_ref, now, agency_id):
    return BookingEvent(
        id=str(uuid.uuid4()),
        agency_id=agency_id,
        event_type="cancellation",
        booking_ref=booking_ref,
        guest_name="",
        destination_city="",
        booking_value=0,
        is_refundable=True,
        checkin_date=now,
        booking_date=now - datetime.timedelta(days=30 - day),
        timestamp=now - datetime.timedelta(days=30 - day),
    )

def _invoice(day, ref, days_late, amount, now, agency_id):
    due = now - datetime.timedelta(days=30 - day + days_late)
    paid = now - datetime.timedelta(days=30 - day)
    return InvoicePayment(
        id=str(uuid.uuid4()),
        agency_id=agency_id,
        invoice_ref=ref,
        due_date=due,
        paid_date=paid,
        amount=float(amount),
        days_late=max(0, days_late),
    )

def _invoice_missed(day, ref, amount, now, agency_id):
    """Invoice that was never paid."""
    return InvoicePayment(
        id=str(uuid.uuid4()),
        agency_id=agency_id,
        invoice_ref=ref,
        due_date=now - datetime.timedelta(days=30 - day),
        paid_date=None,
        amount=float(amount),
        days_late=30 - day,  # still outstanding
    )


def _seed_pearl_voyages_events(db, now):
    """AGY-001 — PearlVoyages Ltd: Clean luxury agency."""
    aid = "AGY-001"
    events = [
        _booking(1,  185000, True,  "Dubai",     "Rahul Mehta",       32, now, aid),
        _booking(1,  142000, True,  "Singapore", "Priya Sharma",      28, now, aid),
        _invoice(2,  "INV-NOV-04", 0, 120000, now, aid),  # paid early (0 days late)
        _booking(3,  220000, True,  "London",    "Arjun Kapoor",      45, now, aid),
        _booking(5,  98000,  False, "Bangkok",   "Sneha Patel",       21, now, aid),
        _booking(6,  175000, True,  "Dubai",     "Vikram Nair",       38, now, aid),
        _booking(8,  310000, True,  "Paris",     "Ananya Desai",      52, now, aid),
        _invoice(9,  "INV-NOV-11", 0, 135000, now, aid),
        _booking(10, 155000, False, "Singapore", "Rohan Joshi",       19, now, aid),
        _booking(11, 195000, True,  "London",    "Meera Iyer",        41, now, aid),
        _booking(13, 88000,  False, "Bangkok",   "Suresh Kumar",      24, now, aid),
        _booking(14, 265000, True,  "New York",  "Kavita Rao",        60, now, aid),
        _invoice(15, "INV-NOV-18", 0, 140000, now, aid),
        _booking(16, 142000, True,  "Dubai",     "Deepak Malhotra",   35, now, aid),
        _booking(18, 198000, False, "Sydney",    "Pooja Agarwal",     47, now, aid),
        _booking(20, 175000, True,  "Singapore", "Nikhil Verma",      29, now, aid),
        _booking(21, 225000, True,  "London",    "Sanjana Choudhury", 55, now, aid),
        _invoice(22, "INV-NOV-25", 0, 145000, now, aid),
        _booking(23, 290000, True,  "Paris",     "Rahul Mehta",       42, now, aid),
        _booking(24, 310000, True,  "New York",  "Arjun Kapoor",      58, now, aid),
        _booking(25, 185000, True,  "Dubai",     "Priya Sharma",      31, now, aid),
        _booking(26, 145000, False, "Bangkok",   "Aditya Singh",      22, now, aid),
        _booking(28, 178000, True,  "Singapore", "Kavita Rao",        37, now, aid),
        _invoice(29, "INV-DEC-02", 0, 130000, now, aid),
        _booking(30, 255000, True,  "London",    "Meera Iyer",        49, now, aid),
    ]
    for e in events:
        db.add(e)


def _seed_alphajet_events(db, now):
    """AGY-002 — AlphaJet Travel: Account takeover on Day 26."""
    aid = "AGY-002"
    # Days 1-25: Normal
    normal = [
        _booking(1,  45000, False, "Mumbai",    "Rajesh Gupta",   18, now, aid),
        _booking(1,  38000, False, "Bangalore", "Sunita Sharma",  14, now, aid),
        _booking(2,  52000, True,  "Bangkok",   "Amit Khanna",    22, now, aid),
        _booking(3,  41000, False, "Goa",       "Pooja Mehta",    11, now, aid),
        _invoice(4,  "INV-NOV-07", 1, 85000, now, aid),
        _booking(5,  67000, True,  "Singapore", "Deepak Verma",   26, now, aid),
        _booking(6,  43000, False, "Mumbai",    "Anita Singh",    16, now, aid),
        _booking(7,  55000, False, "Chennai",   "Ravi Kumar",     19, now, aid),
        _booking(8,  48000, False, "Hyderabad", "Nisha Agarwal",  13, now, aid),
        _booking(9,  39000, True,  "Bangkok",   "Sanjay Patel",   24, now, aid),
        _booking(10, 61000, False, "Goa",       "Priti Joshi",    17, now, aid),
        _invoice(11, "INV-NOV-14", 0, 90000, now, aid),
        _booking(12, 44000, False, "Mumbai",    "Vikram Bose",    15, now, aid),
        _booking(13, 58000, True,  "Singapore", "Leela Nair",     28, now, aid),
        _booking(14, 42000, False, "Bangalore", "Kunal Sharma",   12, now, aid),
        _booking(15, 49000, False, "Chennai",   "Aarti Kapoor",   20, now, aid),
        _invoice(16, "INV-NOV-19", 2, 95000, now, aid),
        _booking(17, 53000, False, "Mumbai",    "Rohit Desai",    18, now, aid),
        _booking(18, 47000, True,  "Bangkok",   "Meena Pillai",   21, now, aid),
        _booking(19, 65000, False, "Singapore", "Tarun Malhotra", 25, now, aid),
        _booking(20, 41000, False, "Goa",       "Neha Choudhury", 14, now, aid),
        _booking(21, 38000, False, "Hyderabad", "Arun Iyer",      16, now, aid),
        _booking(22, 55000, True,  "Bangkok",   "Sunita Sharma",  23, now, aid),
        _invoice(23, "INV-NOV-26", 1, 88000, now, aid),
        _booking(24, 46000, False, "Mumbai",    "Gaurav Reddy",   17, now, aid),
        _booking(25, 52000, False, "Bangalore", "Kavitha Menon",  19, now, aid),
    ]
    for e in normal:
        db.add(e)

    # Day 26: Account takeover — 19 refundable bookings, 3 guest names, Mumbai-concentrated
    takeover_names = ["Rajan Mehra", "Sonia Taneja", "Karan Dev"]
    takeover_values = [85000, 92000, 78000, 88000, 94000, 81000, 96000, 87000, 91000,
                       83000, 89000, 95000, 86000, 79000, 93000, 84000, 90000, 82000, 97000]
    for i, val in enumerate(takeover_values):
        dest = "Bangkok" if i == 13 else "Mumbai"
        db.add(_booking(26, val, True, dest, takeover_names[i % 3], random.randint(3, 6), now, aid))


def _seed_travelmate_events(db, now):
    """AGY-003 — TravelMate India: Slow credit default."""
    aid = "AGY-003"
    events = [
        _booking(1,  18000, False, "Jaipur",    "Mohan Lal",     8,  now, aid),
        _booking(1,  22000, False, "Udaipur",   "Rekha Sharma",  11, now, aid),
        _booking(2,  15000, True,  "Jodhpur",   "Suresh Bhat",   6,  now, aid),
        _booking(3,  24000, False, "Jaisalmer", "Anita Gupta",   14, now, aid),
        _invoice(4,  "INV-NOV-07", 13, 82000, now, aid),  # 13 days late!
        _booking(5,  19000, False, "Jaipur",    "Vikash Kumar",  9,  now, aid),
        _booking(6,  21000, False, "Udaipur",   "Priya Devi",    12, now, aid),
        _booking(7,  16000, True,  "Jodhpur",   "Ramesh Yadav",  7,  now, aid),
        _booking(8,  23000, False, "Jaisalmer", "Geeta Tiwari",  10, now, aid),
        _booking(9,  18000, False, "Jaipur",    "Harish Pandey", 13, now, aid),
        _invoice_missed(10, "INV-NOV-13", 82000, now, aid),  # MISSED
        _booking(11, 20000, False, "Udaipur",   "Sita Ram",      8,  now, aid),
        _booking(12, 17000, True,  "Jodhpur",   "Kamal Sharma",  11, now, aid),
        _invoice(13, "INV-NOV-13-r", 3, 82000, now, aid),  # Paid 3 days late
        _booking(14, 25000, False, "Jaisalmer", "Deepa Verma",   15, now, aid),
        _booking(15, 19000, False, "Jaipur",    "Ravi Shankar",  9,  now, aid),
        _booking(16, 22000, False, "Udaipur",   "Meena Joshi",   12, now, aid),
        _invoice_missed(17, "INV-NOV-20", 94000, now, aid),  # MISSED
        _booking(18, 21000, True,  "Jodhpur",   "Suresh Bhat",   7,  now, aid),
        _booking(19, 18000, False, "Jaipur",    "Rekha Sharma",  10, now, aid),
        _booking(20, 24000, False, "Jaisalmer", "Mohan Lal",     14, now, aid),
        _booking(21, 16000, False, "Udaipur",   "Anita Gupta",   8,  now, aid),
        _booking(22, 23000, False, "Jodhpur",   "Vikash Kumar",  11, now, aid),
        _booking(23, 20000, False, "Jaipur",    "Priya Devi",    9,  now, aid),
        _invoice_missed(24, "INV-NOV-27", 88000, now, aid),  # MISSED
        _booking(25, 19000, False, "Udaipur",   "Ramesh Yadav",  12, now, aid),
        _booking(26, 22000, False, "Jaisalmer", "Geeta Tiwari",  8,  now, aid),
        _booking(28, 18000, False, "Jaipur",    "Harish Pandey", 10, now, aid),
        _booking(29, 21000, False, "Udaipur",   "Sita Ram",      13, now, aid),
    ]
    for e in events:
        db.add(e)


def _seed_fasttrack_events(db, now):
    """AGY-004 — FastTrack Holidays: Inventory blocking."""
    aid = "AGY-004"
    # Normal bookings + clean invoices
    normal = [
        _booking(1, 42000, False, "Goa",       "Ajay Mehta",     18, now, aid),
        _booking(1, 38000, False, "Mumbai",    "Sunita Rao",     14, now, aid),
        _booking(2, 55000, True,  "Singapore", "Vikas Joshi",    24, now, aid),
        _invoice(3, "INV-NOV-06", 1, 75000, now, aid),
    ]
    for e in normal:
        db.add(e)

    # Day 4: Blocking cycle 1 — 14 Goa bookings then 12 cancellations
    test_names = ["Test Name A", "Test Name B", "Test Name C"]
    for i in range(14):
        db.add(_booking(4, 28000, True, "Goa", test_names[i % 3], 12, now, aid))
    for i in range(12):
        db.add(_cancellation(4, f"B-GOA-{i+1:02d}", now, aid))

    # More normal + invoices
    db.add(_booking(5,  44000, False, "Mumbai",    "Priya Kulkarni", 16, now, aid))
    db.add(_booking(6,  51000, False, "Bangalore", "Nitin Shah",     21, now, aid))
    db.add(_booking(7,  39000, True,  "Singapore", "Kavya Reddy",    28, now, aid))
    db.add(_invoice(10, "INV-NOV-13", 0, 80000, now, aid))

    # Day 11: Blocking cycle 2 — 13 Mumbai bookings then 11 cancellations
    test_names_2 = ["Test Name A", "Test Name B", "Test Name C", "Test Name D"]
    for i in range(13):
        db.add(_booking(11, 35000, True, "Mumbai", test_names_2[i % 4], 9, now, aid))
    for i in range(11):
        db.add(_cancellation(11, f"B-MUM-{i+1:02d}", now, aid))

    db.add(_booking(14, 47000, False, "Bangkok", "Rohit Patil", 22, now, aid))
    db.add(_invoice(17, "INV-NOV-20", 1, 82000, now, aid))
    db.add(_invoice(21, "INV-NOV-24", 0, 78000, now, aid))

    # Day 25: Blocking cycle 3 — 11 Goa bookings then 9 cancellations
    for i in range(11):
        db.add(_booking(25, 31000, True, "Goa", test_names_2[i % 4], 8, now, aid))
    for i in range(9):
        db.add(_cancellation(25, f"B-GOA2-{i+1:02d}", now, aid))


def _seed_skytravel_events(db, now):
    """AGY-005 — SkyTravel Pvt Ltd: Pre-planned chargeback fraud."""
    aid = "AGY-005"
    # Phase 1 — Setup (Days 1-10): Increasing refundable, same 4 names
    fraud_names = ["Aakash Nair", "Divya Krishnan", "Sanjay Bhatt", "Lakshmi Rao"]
    destinations = ["Bangalore", "Chennai", "Hyderabad", "Mumbai"]

    # Days 1-10
    phase1 = [
        (1,  24000, True, "Bangalore", "Aakash Nair",    11),
        (1,  28000, True, "Chennai",   "Divya Krishnan",  8),
        (1,  22000, True, "Hyderabad", "Sanjay Bhatt",    9),
        (2,  31000, True, "Bangalore", "Lakshmi Rao",     7),
        (2,  26000, True, "Mumbai",    "Aakash Nair",    10),
        (3,  29000, True, "Chennai",   "Divya Krishnan",  6),
        (3,  33000, True, "Bangalore", "Sanjay Bhatt",    8),
        (4,  25000, False,"Hyderabad", "Renu Pillai",    14),
        (4,  27000, True, "Mumbai",    "Aakash Nair",     7),
    ]
    for day, val, ref, dest, guest, lead in phase1:
        db.add(_booking(day, val, ref, dest, guest, lead, now, aid))

    db.add(_invoice(4,  "INV-NOV-07", 0, 65000, now, aid))  # Paid early

    phase1b = [
        (5,  32000, True, "Chennai",   "Lakshmi Rao",     5),
        (5,  28000, True, "Bangalore", "Divya Krishnan",  8),
        (6,  35000, True, "Hyderabad", "Sanjay Bhatt",    6),
        (6,  23000, True, "Mumbai",    "Aakash Nair",     7),
        (7,  30000, True, "Chennai",   "Lakshmi Rao",     5),
        (7,  29000, True, "Bangalore", "Divya Krishnan",  6),
        (8,  34000, True, "Hyderabad", "Sanjay Bhatt",    4),
        (8,  26000, True, "Mumbai",    "Aakash Nair",     5),
        (9,  31000, True, "Chennai",   "Lakshmi Rao",     4),
        (9,  28000, False,"Bangalore", "Renu Pillai",    12),
        (10, 36000, True, "Hyderabad", "Divya Krishnan",  3),
        (10, 33000, True, "Mumbai",    "Aakash Nair",     4),
    ]
    for day, val, ref, dest, guest, lead in phase1b:
        db.add(_booking(day, val, ref, dest, guest, lead, now, aid))

    db.add(_invoice(10, "INV-NOV-13", 0, 70000, now, aid))  # Paid early

    # Phase 2 — Escalation (Days 11-22): High velocity, all refundable
    phase2 = [
        (11, 42000, "Bangalore"), (11, 45000, "Chennai"), (11, 48000, "Mumbai"),
        (11, 44000, "Hyderabad"), (11, 41000, "Bangalore"),
        (12, 47000, "Chennai"), (12, 43000, "Mumbai"), (12, 46000, "Hyderabad"),
        (12, 42000, "Bangalore"),
        (13, 49000, "Chennai"), (13, 44000, "Mumbai"), (13, 47000, "Hyderabad"),
    ]
    for i, (day, val, dest) in enumerate(phase2):
        db.add(_booking(day, val, True, dest, fraud_names[i % 4], random.randint(3, 5), now, aid))

    db.add(_invoice(14, "INV-NOV-17", 6, 96000, now, aid))  # First late payment!

    phase2b = [
        (14, 51000, "Bangalore"), (14, 48000, "Chennai"),
        (15, 52000, "Mumbai"), (15, 46000, "Hyderabad"), (15, 49000, "Bangalore"),
        (16, 54000, "Chennai"), (16, 51000, "Mumbai"),
        (17, 47000, "Hyderabad"), (17, 53000, "Bangalore"),
        (18, 55000, "Chennai"), (18, 52000, "Mumbai"),
        (19, 48000, "Hyderabad"), (19, 56000, "Bangalore"),
        (20, 53000, "Chennai"), (20, 51000, "Mumbai"),
    ]
    for i, (day, val, dest) in enumerate(phase2b):
        db.add(_booking(day, val, True, dest, fraud_names[i % 4], random.randint(3, 5), now, aid))

    # Day 21: Invoice missed
    db.add(_invoice_missed(21, "INV-NOV-24", 96000, now, aid))
    db.add(_booking(22, 58000, True, "Hyderabad", "Lakshmi Rao",  4, now, aid))
    db.add(_booking(22, 54000, True, "Bangalore", "Aakash Nair",  3, now, aid))

    # Phase 3 — Crystallisation (Days 23-30): Activity stops
    db.add(_invoice_missed(25, "INV-NOV-28", 112000, now, aid))


def _seed_signal_snapshots(db, now, aid, snapshots):
    """Generate signal score history from snapshot data."""
    for snap in snapshots:
        day = snap["day"]
        signals = snap["signals"]
        db.add(SignalScore(
            agency_id=aid,
            computed_at=now - datetime.timedelta(days=30 - day),
            s1_velocity=signals["S1"],
            s2_refundable_ratio=signals["S2"],
            s3_lead_time=signals["S3"],
            s4_cancellation_cascade=signals["S4"],
            s5_credit_utilization=signals["S5"],
            s6_passenger_name_reuse=signals["S6"],
            s7_destination_spike=signals["S7"],
            s8_settlement_delay=signals["S8"],
        ))


# ═══ Snapshot data from agency_profiles.js ═══

SNAPSHOTS = {
    # Purposely empty to start dashboard with flatline history
}


def seed_db(db=None):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if db is None:
        db = SessionLocal()

    now = datetime.datetime.utcnow()

    # 1. Seed agencies
    for a in AGENCIES:
        agency = Agency(
            id=a["id"],
            name=a["name"],
            credit_limit=a["credit_limit"],
            outstanding_balance=a["outstanding_balance"],
            platform_tenure_days=a["tenure_days"],
            cohort_group=a["cohort_group"],
            destination_profile=a["destination_profile"],
            current_trust_score=a["trust_score"],
            current_band=a["band"],
            available_credit=a["credit_limit"] - a["outstanding_balance"],
        )
        db.add(agency)

    db.flush()

    # 2. Skip event and action seeding — clean slate, only simulator populates these
    # (Previously seeded booking events and agency actions are removed for fresh start)

    # 3. Skip Signal Score snapshots - start with 0 history
    for aid, snaps in SNAPSHOTS.items():
        if snaps:
            _seed_signal_snapshots(db, now, aid, snaps)

    # 4. Seed SignalOutcome counters + WeightProfiles
    for aid, wp_data in WEIGHT_PROFILES.items():
        # Outcome counters
        for sig in SIGNAL_IDS:
            s = wp_data["signals"][sig]
            db.add(SignalOutcome(
                agency_id=aid,
                signal_id=sig,
                true_positives=s["tp"],
                false_positives=s["fp"],
                true_negatives=s["tn"],
                false_negatives=s["fn"],
                last_updated=now,
            ))

        # Weight profile — use the "current" weights directly from the spec
        sigs = wp_data["signals"]
        db.add(WeightProfile(
            agency_id=aid,
            w1_velocity=sigs["S1"]["current"],
            w2_refundable_ratio=sigs["S2"]["current"],
            w3_lead_time=sigs["S3"]["current"],
            w4_cancellation_cascade=sigs["S4"]["current"],
            w5_credit_utilization=sigs["S5"]["current"],
            w6_passenger_name_reuse=sigs["S6"]["current"],
            w7_destination_spike=sigs["S7"]["current"],
            w8_settlement_delay=sigs["S8"]["current"],
            r1_velocity=sigs["S1"]["reliability"],
            r2_refundable_ratio=sigs["S2"]["reliability"],
            r3_lead_time=sigs["S3"]["reliability"],
            r4_cancellation_cascade=sigs["S4"]["reliability"],
            r5_credit_utilization=sigs["S5"]["reliability"],
            r6_passenger_name_reuse=sigs["S6"]["reliability"],
            r7_destination_spike=sigs["S7"]["reliability"],
            r8_settlement_delay=sigs["S8"]["reliability"],
            total_observations=wp_data["observations"],
            learning_rate=wp_data["learning_rate"],
            previous_trust_score=wp_data["previous_score"],
        ))

    db.commit()
    db.close()
    print(f"Seeded 5 agencies with canonical profiles, {sum(len(v) for v in SNAPSHOTS.values())} signal snapshots, weight profiles, and event histories.")


# ═══ Action Seed Data ═══

def _action(day, action_type, category, metadata, now, agency_id, risk_indicator=None):
    import json as _json
    return AgencyAction(
        id=str(uuid.uuid4()),
        agency_id=agency_id,
        action_type=action_type,
        category=category,
        metadata_json=_json.dumps(metadata),
        risk_indicator=risk_indicator,
        timestamp=now - datetime.timedelta(days=30 - day, hours=random.randint(0, 23), minutes=random.randint(0, 59)),
    )


def _seed_agency_actions(db, now):
    """Actions should now be entirely generated by the Simulator from a True Zero state."""
    pass


if __name__ == "__main__":
    seed_db()

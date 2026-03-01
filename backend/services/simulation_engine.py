"""
Data-driven Simulation Engine for RiskSense AI.

Replaces the 580-line if/elif chain in the original main.py with a
strategy-pattern approach. Each agency persona is defined as a config
dict with weighted action pools and per-action-type generators.
"""
import random
import uuid
import json
import datetime
from typing import Optional

import models

# ── Shared helper data ──
ROUTES = [
    ("DEL", "DXB"), ("BOM", "LHR"), ("BLR", "SIN"), ("MAA", "KUL"),
    ("HYD", "FRA"), ("DEL", "JFK"), ("BOM", "BKK"), ("CCU", "DOH"),
    ("AMD", "SHJ"), ("PNQ", "KTM"),
]
DEVICES = ["Chrome/Win11", "Safari/MacOS", "Firefox/Linux", "Mobile-Android", "Mobile-iOS", "Edge/Win10"]
GEOS = ["Mumbai, IN", "Delhi, IN", "Unknown", "Lagos, NG", "Dhaka, BD", "Karachi, PK", "Colombo, LK", "Dubai, AE"]
MFA_TYPES = ["SMS OTP", "Email OTP", "Authenticator App", "SMS OTP via Intl Gateway"]
PAY_METHODS = ["Bank Transfer", "NEFT", "RTGS", "UPI", "Cheque", "Credit Card"]
FAIL_REASONS = ["Insufficient Funds", "Account Frozen", "Bank Declined", "Daily Limit Exceeded"]


def _rand_ip():
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _pnr():
    return "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=6))


def _ref():
    return f"BK-{random.randint(10000,99999)}"


def _txn():
    return f"TXN-{random.randint(1000,9999)}"


def _pick(pool):
    """Pick from weighted pool: list of (action_key, weight) tuples."""
    keys, weights = zip(*pool)
    return random.choices(keys, weights=weights, k=1)[0]


# ── Action Generators ──
# Each returns (action: AgencyAction, score_delta: int, decision_action: str)

def gen_payment_received(agency, now, positive=True):
    amt = random.randint(50000, 300000) if positive else random.randint(20000, 100000)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="payment_received", category="settlement",
        metadata_json=json.dumps({"amount": amt, "method": random.choice(PAY_METHODS), "ref": _txn()}),
        risk_indicator=None,
    )
    delta = random.randint(1, 3) if positive else random.randint(1, 2)
    desc = f"Payment of ₹{amt:,} received — positive signal" if positive else f"Partial payment ₹{amt:,} received — positive but insufficient"
    return action, delta, desc


def gen_flight_search(agency, now, risk_indicator=None, lead_range=(7, 45)):
    route = random.choice(ROUTES)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="flight_search", category="search",
        metadata_json=json.dumps({"origin": route[0], "destination": route[1], "pax": random.randint(1, 6), "lead_days": random.randint(*lead_range)}),
        risk_indicator=risk_indicator,
    )
    delta = random.randint(-1, 0) if risk_indicator else 0
    desc = f"Routine search {route[0]}→{route[1]}" if not risk_indicator else f"Search {route[0]}→{route[1]} — short lead"
    return action, delta, desc


def gen_booking_created(agency, now, risky=False, val_range=(15000, 120000), refundable_weight=50):
    route = random.choice(ROUTES)
    val = random.randint(*val_range)
    refundable = random.choices([True, False], weights=[refundable_weight, 100 - refundable_weight], k=1)[0]
    risk = None
    if risky and refundable:
        risk = "High-value refundable — chargeback setup pattern"
    elif risky:
        risk = "Booking while outstanding balance high" if agency.outstanding_balance > agency.credit_limit * 0.6 else None

    # Credit limit check for risky agencies
    if risky and agency.outstanding_balance + val > agency.credit_limit:
        action = models.AgencyAction(
            id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
            action_type="booking_failed", category="booking",
            metadata_json=json.dumps({"ref": _ref(), "value": val, "reason": "Credit Limit Exceeded"}),
            risk_indicator="Booking blocked — insufficient credit",
        )
        return action, random.randint(-3, -1), f"₹{val:,} booking declined — credit exhausted"

    if risky and agency.current_trust_score <= 15:
        action = models.AgencyAction(
            id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
            action_type="booking_failed", category="booking",
            metadata_json=json.dumps({"ref": _ref(), "value": val, "reason": "Account Blocked"}),
            risk_indicator="Booking blocked — account frozen",
        )
        return action, 0, f"₹{val:,} booking declined — account blocked"

    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="booking_created", category="booking",
        metadata_json=json.dumps({
            "ref": _ref(), "value": val, "refundable": refundable,
            "route": f"{route[0]}→{route[1]}", "pax": random.randint(1, 4),
            "lead_days": random.randint(1, 30),
        }),
        risk_indicator=risk,
    )

    if risky and refundable:
        delta = random.randint(-15, -6)
        desc = f"Anomalous booking ₹{val:,} — possible fraud pattern"
    elif risky:
        delta = random.randint(-5, -2)
        desc = f"Booking ₹{val:,} — increasing exposure"
    else:
        delta = random.randint(0, 1)
        desc = f"Standard booking ₹{val:,} — healthy pattern"

    agency.outstanding_balance += val
    return action, delta, desc


def gen_login_success(agency, now, geos=None):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="login_success", category="access",
        metadata_json=json.dumps({"ip": _rand_ip(), "geo": random.choice(geos or ["Mumbai, IN", "Delhi, IN"]), "device": random.choice(DEVICES)}),
        risk_indicator=None,
    )
    return action, 0, "Routine login from known location"


def gen_ticket_issued(agency, now):
    route = random.choice(ROUTES)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="ticket_issued", category="booking",
        metadata_json=json.dumps({"pnr": _pnr(), "route": f"{route[0]}→{route[1]}", "value": random.randint(8000, 80000)}),
        risk_indicator=None,
    )
    return action, random.randint(0, 1), "Ticket issued — normal fulfilment"


def gen_invoice_generated(agency, now):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="invoice_generated", category="settlement",
        metadata_json=json.dumps({"invoice": f"INV-{random.randint(10000,99999)}", "amount": random.randint(30000, 400000), "due_date": "15 days"}),
        risk_indicator=None,
    )
    return action, 0, "Invoice generated — routine"


def gen_session_heartbeat(agency, now, fast=False):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="session_heartbeat", category="access",
        metadata_json=json.dumps({"device": random.choice(DEVICES), "session_length": f"{random.randint(1 if fast else 10, 10 if fast else 90)} mins", "nav_speed": "fast" if fast else "normal"}),
        risk_indicator="Unusually short, rapid session" if fast else None,
    )
    return action, 0, "Session heartbeat — fast navigation noted" if fast else "Routine session heartbeat"


def gen_fare_quote(agency, now):
    route = random.choice(ROUTES)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="fare_quote_request", category="search",
        metadata_json=json.dumps({"origin": route[0], "destination": route[1], "quoted_price": random.randint(5000, 60000), "pax": random.randint(1, 3)}),
        risk_indicator=None,
    )
    return action, 0, "Fare quote requested"


def gen_login_failed(agency, now):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="login_failed", category="access",
        metadata_json=json.dumps({"ip": _rand_ip(), "geo": random.choice(GEOS), "attempts": random.randint(2, 8)}),
        risk_indicator="Multiple failed login attempts from unusual location",
    )
    return action, random.randint(-6, -3), "Suspicious login failures detected"


def gen_mfa_failed(agency, now):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="mfa_challenge_failed", category="access",
        metadata_json=json.dumps({"challenge_type": random.choice(MFA_TYPES), "attempts": random.randint(1, 5)}),
        risk_indicator="MFA bypass attempt",
    )
    return action, random.randint(-10, -5), "MFA challenge failed — security signal elevated"


def gen_device_change(agency, now):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="device_change", category="access",
        metadata_json=json.dumps({"old_device": random.choice(DEVICES[:3]), "new_device": random.choice(DEVICES[3:]), "ip": _rand_ip(), "geo": random.choice(GEOS)}),
        risk_indicator="Sudden device change from new geo",
    )
    return action, random.randint(-8, -4), "Device fingerprint mismatch — ATO signal"


def gen_password_reset(agency, now):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="password_reset_request", category="access",
        metadata_json=json.dumps({"target_email": f"agent{random.randint(1,50)}@test.com", "ip": _rand_ip(), "geo": random.choice(GEOS)}),
        risk_indicator="Password reset from unfamiliar IP",
    )
    return action, random.randint(-5, -3), "Credential change attempt — monitoring"


def gen_booking_modified(agency, now, risk_indicator="Name change on recent booking"):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="booking_modified", category="booking",
        metadata_json=json.dumps({"ref": _ref(), "old_name": "John Smith", "new_name": f"Passenger {random.randint(100,999)}", "time_since_booking": f"{random.randint(1,12)} hours"}),
        risk_indicator=risk_indicator,
    )
    return action, random.randint(-6, -2), "Booking modification — passenger name changed"


def gen_payment_failed(agency, now):
    amt = random.randint(100000, 500000)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="payment_failed", category="settlement",
        metadata_json=json.dumps({"amount": amt, "reason": random.choice(FAIL_REASONS), "method": random.choice(PAY_METHODS)}),
        risk_indicator=f"Payment bounce ₹{amt:,}",
    )
    return action, random.randint(-20, -10), f"Payment of ₹{amt:,} failed — {random.choice(FAIL_REASONS)}"


def gen_credit_limit_request(agency, now):
    req_amt = random.randint(500000, 2000000)
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="credit_limit_request", category="settlement",
        metadata_json=json.dumps({"requested_amount": req_amt, "current_limit": agency.credit_limit, "utilization": f"{round((agency.outstanding_balance / max(agency.credit_limit, 1)) * 100)}%"}),
        risk_indicator="Credit increase request while payments overdue",
    )
    return action, random.randint(-7, -3), f"Credit limit increase to ₹{req_amt:,} requested — risky given payment history"


def gen_booking_cancelled(agency, now, risky=False, reason="Customer requested"):
    action = models.AgencyAction(
        id=str(uuid.uuid4()), agency_id=agency.id, timestamp=now,
        action_type="booking_cancelled", category="booking",
        metadata_json=json.dumps({"pnr": _pnr(), "time_since_booking": f"{random.randint(1, 8)} hours", "reason": reason}),
        risk_indicator="Rapid cancellation — inventory blocking pattern" if risky else None,
    )
    delta = random.randint(-8, -3) if risky else random.randint(-3, -1)
    desc = "Cancel-after-hold detected — inventory hoarding signal" if risky else "Cancellation logged"
    return action, delta, desc


# ── Persona Action Pool Definitions ──
# Each persona defines: weighted action pool + a dispatch function

PERSONA_POOLS = {
    # AGY-001: Good Agency — mostly positive
    "AGY-001": [
        ("payment_received", 30), ("flight_search", 18), ("booking_created", 18),
        ("login_success", 10), ("ticket_issued", 8), ("invoice_generated", 6),
        ("session_heartbeat", 5), ("fare_quote_request", 5),
    ],
    # AGY-002: ATO Suspect — access anomalies
    "AGY-002": [
        ("login_failed", 18), ("mfa_challenge_failed", 15), ("device_change", 14),
        ("password_reset_request", 10), ("booking_created", 14),
        ("flight_search", 10), ("login_success", 9), ("session_heartbeat", 5),
        ("booking_modified", 5),
    ],
    # AGY-003: Credit Default Risk — payment issues
    "AGY-003": [
        ("payment_failed", 25), ("credit_limit_request", 15), ("booking_created", 15),
        ("payment_received", 10), ("flight_search", 10), ("login_success", 8),
        ("invoice_generated", 7), ("session_heartbeat", 5), ("booking_cancelled", 5),
    ],
    # AGY-004: Inventory Blocker — book + rapid cancel
    "AGY-004": [
        ("booking_cancelled", 22), ("booking_created", 20), ("flight_search", 18),
        ("fare_quote_request", 10), ("login_success", 8), ("session_heartbeat", 7),
        ("ticket_issued", 5), ("booking_modified", 5), ("payment_received", 5),
    ],
    # AGY-005 / fallback: Chargeback pattern
    "DEFAULT": [
        ("booking_created", 22), ("booking_cancelled", 20), ("flight_search", 15),
        ("session_heartbeat", 8), ("login_success", 8), ("payment_received", 7),
        ("fare_quote_request", 5), ("device_change", 5), ("payment_failed", 5),
        ("ticket_issued", 5),
    ],
}


def generate_action(agency, now):
    """
    Generate the next simulated action for an agency using a data-driven
    strategy pattern. Returns (action, score_delta, decision_text).
    """
    pool = PERSONA_POOLS.get(agency.id, PERSONA_POOLS["DEFAULT"])
    atype = _pick(pool)

    # Dispatch to the appropriate generator based on agency persona
    persona = agency.id

    # ── AGY-001: Good Agency ──
    if persona == "AGY-001":
        dispatch = {
            "payment_received": lambda: gen_payment_received(agency, now, positive=True),
            "flight_search": lambda: gen_flight_search(agency, now),
            "booking_created": lambda: gen_booking_created(agency, now, risky=False),
            "login_success": lambda: gen_login_success(agency, now, geos=["Mumbai, IN", "Delhi, IN", "Pune, IN"]),
            "ticket_issued": lambda: gen_ticket_issued(agency, now),
            "invoice_generated": lambda: gen_invoice_generated(agency, now),
            "session_heartbeat": lambda: gen_session_heartbeat(agency, now, fast=False),
            "fare_quote_request": lambda: gen_fare_quote(agency, now),
        }

    # ── AGY-002: ATO Suspect ──
    elif persona == "AGY-002":
        dispatch = {
            "login_failed": lambda: gen_login_failed(agency, now),
            "mfa_challenge_failed": lambda: gen_mfa_failed(agency, now),
            "device_change": lambda: gen_device_change(agency, now),
            "password_reset_request": lambda: gen_password_reset(agency, now),
            "booking_created": lambda: gen_booking_created(agency, now, risky=True, val_range=(80000, 200000), refundable_weight=90),
            "flight_search": lambda: gen_flight_search(agency, now, risk_indicator="Rapid searches with short lead times", lead_range=(1, 5)),
            "login_success": lambda: gen_login_success(agency, now, geos=GEOS),
            "session_heartbeat": lambda: gen_session_heartbeat(agency, now, fast=True),
            "booking_modified": lambda: gen_booking_modified(agency, now),
        }

    # ── AGY-003: Credit Default ──
    elif persona == "AGY-003":
        dispatch = {
            "payment_failed": lambda: gen_payment_failed(agency, now),
            "credit_limit_request": lambda: gen_credit_limit_request(agency, now),
            "booking_created": lambda: gen_booking_created(agency, now, risky=True, val_range=(20000, 150000)),
            "payment_received": lambda: gen_payment_received(agency, now, positive=False),
            "flight_search": lambda: gen_flight_search(agency, now),
            "login_success": lambda: gen_login_success(agency, now, geos=["Mumbai, IN", "Kolkata, IN"]),
            "invoice_generated": lambda: gen_invoice_generated(agency, now),
            "session_heartbeat": lambda: gen_session_heartbeat(agency, now),
            "booking_cancelled": lambda: gen_booking_cancelled(agency, now),
        }

    # ── AGY-004: Inventory Blocker ──
    elif persona == "AGY-004":
        dispatch = {
            "booking_cancelled": lambda: gen_booking_cancelled(agency, now, risky=True, reason="Agent cancelled"),
            "booking_created": lambda: gen_booking_created(agency, now, risky=True, val_range=(10000, 80000), refundable_weight=90),
            "flight_search": lambda: gen_flight_search(agency, now, risk_indicator="High-volume searches on peak routes", lead_range=(1, 7)),
            "fare_quote_request": lambda: gen_fare_quote(agency, now),
            "login_success": lambda: gen_login_success(agency, now, geos=["Bengaluru, IN", "Chennai, IN"]),
            "session_heartbeat": lambda: gen_session_heartbeat(agency, now, fast=True),
            "ticket_issued": lambda: gen_ticket_issued(agency, now),
            "booking_modified": lambda: gen_booking_modified(agency, now, risk_indicator="Frequent modifications within hold window"),
            "payment_received": lambda: gen_payment_received(agency, now, positive=True),
        }

    # ── Default / AGY-005: Chargeback ──
    else:
        dispatch = {
            "booking_created": lambda: gen_booking_created(agency, now, risky=True, val_range=(15000, 80000), refundable_weight=80),
            "booking_cancelled": lambda: gen_booking_cancelled(agency, now, risky=True, reason=random.choice(["Customer request", "Schedule change", "Agent initiated"])),
            "flight_search": lambda: gen_flight_search(agency, now, risk_indicator="Short lead-time, high-risk route search", lead_range=(1, 7)),
            "session_heartbeat": lambda: gen_session_heartbeat(agency, now),
            "login_success": lambda: gen_login_success(agency, now, geos=GEOS),
            "payment_received": lambda: gen_payment_received(agency, now, positive=False),
            "fare_quote_request": lambda: gen_fare_quote(agency, now),
            "device_change": lambda: gen_device_change(agency, now),
            "payment_failed": lambda: gen_payment_failed(agency, now),
            "ticket_issued": lambda: gen_ticket_issued(agency, now),
        }

    generator = dispatch.get(atype)
    if generator:
        return generator()

    # Ultimate fallback
    return gen_session_heartbeat(agency, now)

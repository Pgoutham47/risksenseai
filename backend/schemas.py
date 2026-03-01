from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AgencyBase(BaseModel):
    id: str
    name: str
    credit_limit: float
    outstanding_balance: float
    platform_tenure_days: int
    cohort_group: str
    destination_profile: str
    current_trust_score: int
    current_band: str
    available_credit: float
    credit_ladder_state: Optional[str] = "FULL"

class AgencyProfile(AgencyBase):
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class SignalScoreOut(BaseModel):
    computed_at: datetime
    s1_velocity: float
    s2_refundable_ratio: float
    s3_lead_time: float
    s4_cancellation_cascade: float
    s5_credit_utilization: float
    s6_passenger_name_reuse: float
    s7_destination_spike: float
    s8_settlement_delay: float
    class Config:
        from_attributes = True

class BookingEventOut(BaseModel):
    id: str
    event_type: str
    booking_ref: str
    guest_name: Optional[str] = None
    destination_city: Optional[str] = None
    booking_value: float = 0.0
    is_refundable: bool = False
    checkin_date: Optional[datetime] = None
    booking_date: Optional[datetime] = None
    timestamp: datetime
    agency_id: str
    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: str
    agency_id: str
    alert_type: str
    severity: str
    message: str
    is_acknowledged: bool
    is_escalated: bool
    created_at: datetime
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_agencies: int
    at_risk_count: int
    alerts_today: int
    total_credit_exposure: float

class BandDistribution(BaseModel):
    band: str
    count: int

class TimelinePoint(BaseModel):
    date: str
    avg_score: float

class OverrideRequest(BaseModel):
    notes: str
    band: Optional[str] = None

class TBOSimulateRequest(BaseModel):
    agency_id: str
    scenario: str

# ─── Bayesian / Investigation Schemas ───

class SignalOutcomeCounters(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int

class SignalDetail(BaseModel):
    id: str
    name: str
    fraud_type: str
    value: float
    direction: str  # ↑ ↓ →
    weight: float
    prior_weight: float
    status: str  # NORMAL / ELEVATED / CRITICAL / LOCKED
    locked: bool
    lock_reason: str
    reliability: float
    tp: int
    fp: int
    tn: int
    fn: int
    contribution: float

class WeightProfileOut(BaseModel):
    agency_id: str
    total_observations: int
    learning_rate: float
    previous_trust_score: Optional[int] = None
    weights: dict  # S1..S8 -> float
    reliabilities: dict  # S1..S8 -> float
    prior_weights: dict  # S1..S8 -> float
    counters: dict  # S1..S8 -> {tp, fp, tn, fn}

class InvestigationSnapshot(BaseModel):
    agency_id: str
    agency_name: str
    tenure_days: int
    cohort: str
    learning_rate: float
    total_observations: int
    trusted_signals: List[str]
    discounted_signals: List[str]
    locked_signals: List[str]
    signals: List[SignalDetail]
    trust_score: int
    previous_score: Optional[int] = None
    trajectory: str
    risk: float
    band: str
    credit_action: str
    contributions: dict
    amplifier_applied: bool
    tenure_adjustment: float
    confidence: str
    confidence_reason: str
    can_act_autonomously: bool
    # Multi-signal combination fields
    signal_strength: str = "WEAK"                    # WEAK/MODERATE/STRONG/CRITICAL
    elevated_count: int = 0
    elevated_signals: List[str] = []
    fraud_hypothesis: Optional[str] = None           # Primary fraud type hypothesis
    fraud_hypotheses: List[dict] = []                 # All matching hypotheses
    combination_action: str = "Watch only."           # Recommended action from combination
    # Chargeback phase detection
    chargeback_phase: Optional[dict] = None
    # Three-level containment recommendation
    containment: Optional[dict] = None

class AgencyActionOut(BaseModel):
    id: str
    agency_id: str
    action_type: str
    category: str
    metadata_json: str
    risk_indicator: Optional[str]
    timestamp: datetime
    class Config:
        from_attributes = True

class SimulateNextActionRequest(BaseModel):
    agency_id: str

class DecisionOut(BaseModel):
    id: int
    agency_id: str
    trust_score: int
    band: str
    credit_action: Optional[str] = None
    top_signal_1: Optional[str] = None
    top_signal_2: Optional[str] = None
    top_signal_3: Optional[str] = None
    explanation: Optional[str] = None
    counterfactual_guidance: Optional[str] = None
    analyst_override: bool = False
    analyst_notes: Optional[str] = None
    decided_at: Optional[datetime] = None

    class Config:
        from_attributes = True

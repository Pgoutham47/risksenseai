from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime

from database import Base

class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    credit_limit = Column(Float)
    outstanding_balance = Column(Float)
    platform_tenure_days = Column(Integer)
    
    cohort_group = Column(String) # Small/Medium/Large
    destination_profile = Column(String) # Domestic/International/Mixed
    
    current_trust_score = Column(Integer)
    current_band = Column(String)
    available_credit = Column(Float)
    credit_ladder_state = Column(String, default='FULL')  # FULL/SOFT_WATCH/SURGICAL/MODERATE_CONTRACT/HARD_CONTRACT/FROZEN
    
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    booking_events = relationship("BookingEvent", back_populates="agency")
    signal_scores = relationship("SignalScore", back_populates="agency")
    decisions = relationship("Decision", back_populates="agency")
    alerts = relationship("Alert", back_populates="agency")
    invoice_payments = relationship("InvoicePayment", back_populates="agency")
    signal_outcomes = relationship("SignalOutcome", back_populates="agency")
    weight_profile = relationship("WeightProfile", back_populates="agency", uselist=False)
    actions = relationship("AgencyAction", back_populates="agency")

class BookingEvent(Base):
    __tablename__ = "booking_events"

    id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    event_type = Column(String) # search/booking/cancellation/payment
    booking_ref = Column(String, index=True)
    guest_name = Column(String)
    destination_city = Column(String)
    booking_value = Column(Float)
    is_refundable = Column(Boolean)
    checkin_date = Column(DateTime)
    booking_date = Column(DateTime)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    agency = relationship("Agency", back_populates="booking_events")

class SignalScore(Base):
    __tablename__ = "signal_scores"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    s1_velocity = Column(Float)
    s2_refundable_ratio = Column(Float)
    s3_lead_time = Column(Float)
    s4_cancellation_cascade = Column(Float)
    s5_credit_utilization = Column(Float)
    s6_passenger_name_reuse = Column(Float)
    s7_destination_spike = Column(Float)
    s8_settlement_delay = Column(Float)
    
    agency = relationship("Agency", back_populates="signal_scores")

class Decision(Base):
    __tablename__ = "decisions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    trust_score = Column(Integer)
    band = Column(String)
    credit_action = Column(String)
    
    top_signal_1 = Column(String)
    top_signal_2 = Column(String)
    top_signal_3 = Column(String, nullable=True)
    
    explanation = Column(String)
    counterfactual_guidance = Column(String)
    
    analyst_override = Column(Boolean, default=False)
    analyst_notes = Column(String, nullable=True)
    decided_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    agency = relationship("Agency", back_populates="decisions")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    alert_type = Column(String)
    severity = Column(String) # INFO/WARNING/CRITICAL
    message = Column(String)
    is_acknowledged = Column(Boolean, default=False)
    is_escalated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    agency = relationship("Agency", back_populates="alerts")

class InvoicePayment(Base):
    __tablename__ = "invoice_payments"
    
    id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    invoice_ref = Column(String)
    due_date = Column(DateTime)
    paid_date = Column(DateTime, nullable=True)
    amount = Column(Float)
    days_late = Column(Integer, default=0)
    
    agency = relationship("Agency", back_populates="invoice_payments")

class TBOApiError(Base):
    __tablename__ = "tbo_api_errors"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    endpoint = Column(String)
    error_type = Column(String)
    error_message = Column(String)
    resolved = Column(Boolean, default=False)

class SignalOutcome(Base):
    """Per-agency, per-signal outcome counters for Bayesian weight evolution."""
    __tablename__ = "signal_outcomes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    signal_id = Column(String)  # 'S1' through 'S8'
    
    true_positives = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    true_negatives = Column(Integer, default=0)
    false_negatives = Column(Integer, default=0)
    
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    
    agency = relationship("Agency", back_populates="signal_outcomes")

class WeightProfile(Base):
    """Personalised Bayesian weight profile per agency."""
    __tablename__ = "weight_profiles"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agency_id = Column(String, ForeignKey("agencies.id"), unique=True)
    
    # Personalised weights (evolved from prior via Bayesian updates)
    w1_velocity = Column(Float, default=0.22)
    w2_refundable_ratio = Column(Float, default=0.20)
    w3_lead_time = Column(Float, default=0.12)
    w4_cancellation_cascade = Column(Float, default=0.08)
    w5_credit_utilization = Column(Float, default=0.16)
    w6_passenger_name_reuse = Column(Float, default=0.04)
    w7_destination_spike = Column(Float, default=0.04)
    w8_settlement_delay = Column(Float, default=0.14)
    
    # Reliability scores (F1) per signal
    r1_velocity = Column(Float, default=0.5)
    r2_refundable_ratio = Column(Float, default=0.5)
    r3_lead_time = Column(Float, default=0.5)
    r4_cancellation_cascade = Column(Float, default=0.5)
    r5_credit_utilization = Column(Float, default=0.5)
    r6_passenger_name_reuse = Column(Float, default=0.5)
    r7_destination_spike = Column(Float, default=0.5)
    r8_settlement_delay = Column(Float, default=0.5)
    
    total_observations = Column(Integer, default=0)
    learning_rate = Column(Float, default=0.0)
    
    previous_trust_score = Column(Integer, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    agency = relationship("Agency", back_populates="weight_profile")

class AgencyAction(Base):
    """Unified action log for all 16 monitored agency action types."""
    __tablename__ = "agency_actions"

    id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, ForeignKey("agencies.id"))
    action_type = Column(String, index=True)  # e.g. login_success, flight_search, booking_created
    category = Column(String)  # access, search, booking, settlement
    metadata_json = Column(String)  # JSON blob with action-specific details
    risk_indicator = Column(String, nullable=True)  # short description if suspicious
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agency = relationship("Agency", back_populates="actions")

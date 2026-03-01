import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import BookingEvent, InvoicePayment, Agency

def get_db_now():
    return datetime.datetime.utcnow()

def compute_s1_velocity(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S1 — Booking Velocity (weight: 22%)
    """
    two_hours_ago = now - datetime.timedelta(hours=2)
    ninety_days_ago = now - datetime.timedelta(days=90)
    
    recent_bookings_count = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp >= two_hours_ago
    ).count()
    current_hourly_rate = recent_bookings_count / 2.0
    
    historical_bookings_count = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp >= ninety_days_ago
    ).count()
    ninety_days_hours = 90 * 24
    historical_hourly_rate = historical_bookings_count / ninety_days_hours
    
    if historical_hourly_rate == 0:
        return 0.0 if current_hourly_rate == 0 else 1.0
        
    ratio = current_hourly_rate / historical_hourly_rate
    
    if ratio >= 3.0:
        return 1.0
    elif ratio <= 1.0:
        return 0.0
    else:
        return (ratio - 1.0) / 2.0

def compute_s2_refundable_ratio(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S2 — Refundable Ratio (weight: 20%)
    """
    seven_days_ago = now - datetime.timedelta(days=7)
    
    recent_total = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id, BookingEvent.event_type == 'booking', BookingEvent.timestamp >= seven_days_ago
    ).count()
    recent_refund = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id, BookingEvent.event_type == 'booking', BookingEvent.is_refundable == True, BookingEvent.timestamp >= seven_days_ago
    ).count()
    recent_pct = (recent_refund / recent_total * 100) if recent_total > 0 else 0
    
    hist_total = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id, BookingEvent.event_type == 'booking', BookingEvent.timestamp < seven_days_ago
    ).count()
    hist_refund = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id, BookingEvent.event_type == 'booking', BookingEvent.is_refundable == True, BookingEvent.timestamp < seven_days_ago
    ).count()
    hist_pct = (hist_refund / hist_total * 100) if hist_total > 0 else 0
    
    jump = recent_pct - hist_pct
    if jump <= 0:
        return 0.0
    elif jump >= 50.0:
        return 1.0
    else:
        return jump / 50.0

def compute_s3_lead_time(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S3 — Lead Time Compression (weight: 12%)
    """
    fourteen_days_ago = now - datetime.timedelta(days=14)
    
    recent_bookings = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp >= fourteen_days_ago
    ).all()
    
    hist_bookings = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp < fourteen_days_ago
    ).all()
    
    def get_avg_lead(bookings):
        if not bookings: return 0
        leads = [(b.checkin_date - b.booking_date).days for b in bookings if b.checkin_date and b.booking_date]
        if not leads: return 0
        return sum(leads) / len(leads)
        
    recent_avg = get_avg_lead(recent_bookings)
    hist_avg = get_avg_lead(hist_bookings)
    
    if hist_avg <= 14:
        if recent_avg >= 14: return 0.0
        elif recent_avg <= 7: return 1.0
        else: return (14 - recent_avg) / 7.0
            
    if recent_avg <= 7: return 1.0
    elif recent_avg >= 14: return 0.0
    else: return (14 - recent_avg) / 7.0

def compute_s4_cancellation_cascade(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S4 — Cancellation Cascade (weight: 8%)
    """
    ninety_days_ago = now - datetime.timedelta(days=90)
    bookings = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp >= ninety_days_ago
    ).order_by(BookingEvent.timestamp).all()
    
    cancellations = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'cancellation',
        BookingEvent.timestamp >= ninety_days_ago
    ).all()
    
    cancelled_refs = {c.booking_ref: c.timestamp for c in cancellations}
    
    max_score = 0.0
    n = len(bookings)
    for i in range(n):
        burst = [bookings[i]]
        for j in range(i+1, n):
            if (bookings[j].timestamp - bookings[i].timestamp).total_seconds() <= 1800:
                burst.append(bookings[j])
            else:
                break
        
        if len(burst) >= 4:
            cancelled_count = sum(1 for b in burst if b.booking_ref in cancelled_refs and (cancelled_refs[b.booking_ref] - b.timestamp).total_seconds() <= 21600)
            cancel_pct = cancelled_count / len(burst)
            max_score = max(max_score, min(1.0, cancel_pct * 2.0))
                
    return max_score

def compute_s5_credit_utilization(agency: Agency) -> float:
    """
    S5 — Credit Utilization (weight: 16%)
    """
    if not agency.credit_limit or agency.credit_limit <= 0:
        return 0.0
    
    utilization = agency.outstanding_balance / agency.credit_limit
    if utilization < 0.6: return 0.0
    elif utilization >= 1.0: return 1.0
    else: return (utilization - 0.6) / 0.4

def compute_s6_passenger_name_reuse(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S6 — Passenger Name Reuse (weight: 4%)
    """
    thirty_days_ago = now - datetime.timedelta(days=30)
    
    counts = db.query(BookingEvent.guest_name, func.count(BookingEvent.id)).filter(
        BookingEvent.agency_id == agency_id,
        BookingEvent.event_type == 'booking',
        BookingEvent.timestamp >= thirty_days_ago
    ).group_by(BookingEvent.guest_name).all()
    
    if not counts: return 0.0
    max_appearances = max([c[1] for c in counts])
    
    if max_appearances >= 5: return 1.0
    elif max_appearances <= 1: return 0.0
    else: return (max_appearances - 1) / 4.0

def compute_s7_destination_spike(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S7 — Destination Spike (weight: 4%)
    """
    thirty_days_ago = now - datetime.timedelta(days=30)
    
    recent_bookings = db.query(BookingEvent).filter(
        BookingEvent.agency_id == agency_id, BookingEvent.event_type == 'booking', BookingEvent.timestamp >= thirty_days_ago
    ).all()
    
    total = len(recent_bookings)
    if total == 0: return 0.0
        
    dest_counts = {}
    for b in recent_bookings:
        dest_counts[b.destination_city] = dest_counts.get(b.destination_city, 0) + 1
        
    top_dest_count = max(dest_counts.values()) if dest_counts else 0
    top_pct = (top_dest_count / total * 100)
    
    if top_pct <= 50.0: return 0.0
    elif top_pct >= 70.0: return 1.0
    else: return (top_pct - 50.0) / 20.0

def compute_s8_settlement_delay(db: Session, agency_id: str, now: datetime.datetime) -> float:
    """
    S8 — Settlement Delay (weight: 14%)
    """
    ninety_days_ago = now - datetime.timedelta(days=90)
    
    invoices = db.query(InvoicePayment).filter(
        InvoicePayment.agency_id == agency_id,
        InvoicePayment.due_date >= ninety_days_ago
    ).all()
    
    if not invoices: return 0.0
    total_days_late = sum(inv.days_late for inv in invoices)
    avg_days_late = total_days_late / len(invoices)
    
    if avg_days_late <= 3.0: return 0.0
    elif avg_days_late >= 15.0: return 1.0
    else: return (avg_days_late - 3.0) / 12.0

def compute_all_signals(db: Session, agency: Agency, now: datetime.datetime) -> tuple:
    s1 = min(1.0, max(0.0, compute_s1_velocity(db, agency.id, now)))
    s2 = min(1.0, max(0.0, compute_s2_refundable_ratio(db, agency.id, now)))
    s3 = min(1.0, max(0.0, compute_s3_lead_time(db, agency.id, now)))
    s4 = min(1.0, max(0.0, compute_s4_cancellation_cascade(db, agency.id, now)))
    s5 = min(1.0, max(0.0, compute_s5_credit_utilization(agency)))
    s6 = min(1.0, max(0.0, compute_s6_passenger_name_reuse(db, agency.id, now)))
    s7 = min(1.0, max(0.0, compute_s7_destination_spike(db, agency.id, now)))
    s8 = min(1.0, max(0.0, compute_s8_settlement_delay(db, agency.id, now)))
    return (float(s1), float(s2), float(s3), float(s4), float(s5), float(s6), float(s7), float(s8))

"""
Chargeback Phase Detection for RiskSense AI.

Implements the three-phase chargeback fraud early warning model:
  Phase 1 — Setup (21-30 days before): early behavioural shifts
  Phase 2 — Escalation (7-21 days before): accelerating risk
  Phase 3 — Crystallisation (0-7 days before): disengagement

Each phase has specific signal thresholds and recommended responses.
"""

from typing import Dict, Optional
from models import Agency


# Phase thresholds based on framework specification
PHASE_THRESHOLDS = {
    1: {
        'description': 'Setup — behavioural shifts beginning',
        'timeframe': '21-30 days before fraud completes',
        'conditions': {
            's2_min': 0.30,       # Refundable ratio climbing toward 40-50%
            's1_min': 0.20,       # Velocity ~30% above normal
            's3_min': 0.20,       # Lead times beginning to compress
            's5_min': 0.40,       # Credit utilization rising
        },
        'min_signals_met': 2,     # At least 2 of 4 conditions
        'response': 'Enter WATCH status. Monitoring frequency doubled. Analyst notified but NO credit action taken.',
    },
    2: {
        'description': 'Escalation — accelerating risk pattern',
        'timeframe': '7-21 days before fraud completes',
        'conditions': {
            's1_min': 0.60,       # Velocity 3-5x normal
            's2_min': 0.70,       # Refundable ratio past 70%
            's5_min': 0.70,       # Credit at/above 85% utilization
            's8_min': 0.20,       # First invoice payment arrives late
        },
        'min_signals_met': 3,     # At least 3 of 4 conditions
        'response': 'Surgical credit controls applied. Refundable booking cap introduced. High-value bookings require pre-approval. Senior analyst assigned.',
    },
    3: {
        'description': 'Crystallisation — disengagement and fraud completion',
        'timeframe': '0-7 days before fraud completes',
        'conditions': {
            's1_max': 0.05,       # Booking activity stops completely
            's5_min': 0.85,       # Credit near or at maximum
            's8_min': 0.50,       # No new invoice payments / serious delays
        },
        'min_signals_met': 2,     # At least 2 of 3 conditions
        'response': 'Credit frozen immediately. Maximum possible loss already bounded by Phase 2 controls. Recovery process opened. Legal hold initiated.',
    },
}


def detect_chargeback_phase(
    signal_values: Dict[str, float],
    agency: Agency,
) -> dict:
    """
    Detect which chargeback fraud phase (if any) the agency is in.
    
    Returns {
        'phase': int (0, 1, 2, or 3),
        'phase_description': str,
        'phase_response': str,
        'conditions_met': list,
        'confidence': str,
    }
    """
    s1 = signal_values.get('S1', 0)
    s2 = signal_values.get('S2', 0)
    s3 = signal_values.get('S3', 0)
    s5 = signal_values.get('S5', 0)
    s8 = signal_values.get('S8', 0)
    
    # Check phases in reverse order (most severe first)
    # Phase 3: Crystallisation
    p3_conditions = []
    p3 = PHASE_THRESHOLDS[3]
    if s1 <= p3['conditions']['s1_max']:
        p3_conditions.append(f"S1 Booking Velocity at {s1:.2f} (activity stopped)")
    if s5 >= p3['conditions']['s5_min']:
        p3_conditions.append(f"S5 Credit Utilization at {s5:.2f} (near maximum)")
    if s8 >= p3['conditions']['s8_min']:
        p3_conditions.append(f"S8 Settlement Delay at {s8:.2f} (serious delays)")
    
    if len(p3_conditions) >= p3['min_signals_met']:
        return {
            'phase': 3,
            'phase_description': p3['description'],
            'phase_timeframe': p3['timeframe'],
            'phase_response': p3['response'],
            'conditions_met': p3_conditions,
            'confidence': 'HIGH' if len(p3_conditions) == 3 else 'MEDIUM',
        }
    
    # Phase 2: Escalation
    p2_conditions = []
    p2 = PHASE_THRESHOLDS[2]
    if s1 >= p2['conditions']['s1_min']:
        p2_conditions.append(f"S1 Booking Velocity at {s1:.2f} (3-5x normal)")
    if s2 >= p2['conditions']['s2_min']:
        p2_conditions.append(f"S2 Refundable Ratio at {s2:.2f} (past 70%)")
    if s5 >= p2['conditions']['s5_min']:
        p2_conditions.append(f"S5 Credit Utilization at {s5:.2f} (above 85%)")
    if s8 >= p2['conditions']['s8_min']:
        p2_conditions.append(f"S8 Settlement Delay at {s8:.2f} (late invoice)")
    
    if len(p2_conditions) >= p2['min_signals_met']:
        return {
            'phase': 2,
            'phase_description': p2['description'],
            'phase_timeframe': p2['timeframe'],
            'phase_response': p2['response'],
            'conditions_met': p2_conditions,
            'confidence': 'HIGH' if len(p2_conditions) == 4 else 'MEDIUM',
        }
    
    # Phase 1: Setup
    p1_conditions = []
    p1 = PHASE_THRESHOLDS[1]
    if s2 >= p1['conditions']['s2_min']:
        p1_conditions.append(f"S2 Refundable Ratio at {s2:.2f} (climbing)")
    if s1 >= p1['conditions']['s1_min']:
        p1_conditions.append(f"S1 Booking Velocity at {s1:.2f} (above normal)")
    if s3 >= p1['conditions']['s3_min']:
        p1_conditions.append(f"S3 Lead Time at {s3:.2f} (compressing)")
    if s5 >= p1['conditions']['s5_min']:
        p1_conditions.append(f"S5 Credit Utilization at {s5:.2f} (rising)")
    
    if len(p1_conditions) >= p1['min_signals_met']:
        return {
            'phase': 1,
            'phase_description': p1['description'],
            'phase_timeframe': p1['timeframe'],
            'phase_response': p1['response'],
            'conditions_met': p1_conditions,
            'confidence': 'HIGH' if len(p1_conditions) >= 3 else 'LOW',
        }
    
    # No chargeback phase detected
    return {
        'phase': 0,
        'phase_description': 'No chargeback pattern detected',
        'phase_timeframe': 'N/A',
        'phase_response': 'No action required.',
        'conditions_met': [],
        'confidence': 'N/A',
    }

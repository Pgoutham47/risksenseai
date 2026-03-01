"""
Three-Level Containment Model for RiskSense AI.

Implements containment as recommended actions and event tracking:
  Level 1 — SESSION CONTAINMENT (response time: minutes)
  Level 2 — USER CONTAINMENT (response time: hours)
  Level 3 — AGENCY CREDIT ACTION (response time: days)

Principle: Contain risk at the lowest possible level.
Generalise only when containment fails.
"""

import datetime
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from models import Agency


# ─── Containment Level Definitions ───
CONTAINMENT_LEVELS = {
    'SESSION': {
        'level': 1,
        'response_time': 'minutes',
        'description': 'Session Containment',
        'actions': [
            'Lock the specific suspicious session',
            'Force step-up authentication for that user only',
            'All other users on the account continue unaffected',
            'No credit action taken',
        ],
    },
    'USER': {
        'level': 2,
        'response_time': 'hours',
        'description': 'User Containment',
        'actions': [
            'Freeze this user\'s booking permissions',
            'Force password reset and device re-verification',
            'Notify agency admin as partner (not suspect)',
            'No agency-level credit action',
        ],
    },
    'AGENCY': {
        'level': 3,
        'response_time': 'days',
        'description': 'Agency Credit Action',
        'actions': [
            'Apply surgical credit controls',
            'Begin formal investigation',
            'Assign senior analyst',
        ],
    },
}


def evaluate_containment_level(
    signal_strength: str,
    elevated_signals: list,
    fraud_hypothesis: Optional[str],
    trust_score: int,
    confidence: str,
) -> dict:
    """
    Determine the minimum containment level needed.
    
    Session → when 1-2 signals elevated, ATO-type pattern
    User → when session containment would be insufficient, correlated user behavior
    Agency → when admin compromised, multiple users correlated, or significant credit exposure
    
    Returns {
        'level': str (SESSION / USER / AGENCY),
        'level_number': int (1, 2, 3),
        'reason': str,
        'recommended_actions': list,
        'escalation_criteria': str,
        'notification_text': str,
    }
    """
    # No containment needed for weak signals
    if signal_strength == 'WEAK':
        return {
            'level': 'NONE',
            'level_number': 0,
            'reason': 'No containment needed — signals within normal range.',
            'recommended_actions': ['Continue monitoring'],
            'escalation_criteria': 'N/A',
            'notification_text': '',
        }
    
    # CRITICAL → Agency level
    if signal_strength == 'CRITICAL':
        level_info = CONTAINMENT_LEVELS['AGENCY']
        return {
            'level': 'AGENCY',
            'level_number': 3,
            'reason': f'Critical signal strength with {fraud_hypothesis or "unknown"} hypothesis. Immediate agency-level action required.',
            'recommended_actions': level_info['actions'],
            'escalation_criteria': 'Already at highest containment level.',
            'notification_text': (
                'We have detected a critical pattern requiring immediate review. '
                'Your account team has been notified and will contact you within 1 hour.'
            ),
        }
    
    # STRONG → User level (with agency escalation conditions noted)
    if signal_strength == 'STRONG':
        level_info = CONTAINMENT_LEVELS['USER']
        return {
            'level': 'USER',
            'level_number': 2,
            'reason': f'Strong {fraud_hypothesis or "fraud"} signal — user-level containment recommended.',
            'recommended_actions': level_info['actions'],
            'escalation_criteria': (
                'Escalate to AGENCY if: admin user is compromised, '
                'multiple users show correlated behaviour, '
                'significant credit exposure created, '
                'or agency admin does not respond within 4 hours.'
            ),
            'notification_text': (
                'We detected unusual activity on one of your user accounts. '
                'Please verify — your credit and other users are unaffected.'
            ),
        }
    
    # MODERATE → Session level
    if signal_strength == 'MODERATE':
        # ATO-specific: session containment is ideal
        if fraud_hypothesis == 'Account Takeover':
            level_info = CONTAINMENT_LEVELS['SESSION']
            return {
                'level': 'SESSION',
                'level_number': 1,
                'reason': 'Account Takeover pattern detected — session-level containment sufficient.',
                'recommended_actions': level_info['actions'],
                'escalation_criteria': (
                    'Escalate to USER if containment does not resolve within 2 hours, '
                    'or if anomaly correlates with other users on the same account.'
                ),
                'notification_text': '',  # No notification at session level
            }
        else:
            # Other fraud types at MODERATE → Session level still
            level_info = CONTAINMENT_LEVELS['SESSION']
            return {
                'level': 'SESSION',
                'level_number': 1,
                'reason': f'{fraud_hypothesis or "Suspicious"} pattern at moderate strength — session containment first.',
                'recommended_actions': level_info['actions'],
                'escalation_criteria': (
                    'Escalate to USER if session containment is insufficient within 2 hours.'
                ),
                'notification_text': '',
            }
    
    # Fallback
    return {
        'level': 'NONE',
        'level_number': 0,
        'reason': 'Insufficient evidence for containment.',
        'recommended_actions': ['Continue monitoring'],
        'escalation_criteria': 'N/A',
        'notification_text': '',
    }

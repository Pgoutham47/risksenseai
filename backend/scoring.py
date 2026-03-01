"""
Trust Score computation — supports both fixed platform-wide weights
and personalised Bayesian weights.
"""

from typing import Dict, Optional, List, Tuple


# Platform-wide prior weights (fallback for new agencies)
PLATFORM_WEIGHTS = {
    'S1': 0.22, 'S2': 0.20, 'S3': 0.12, 'S4': 0.08,
    'S5': 0.16, 'S6': 0.04, 'S7': 0.04, 'S8': 0.14,
}


def compute_trust_score(
    s1: float, s2: float, s3: float, s4: float,
    s5: float, s6: float, s7: float, s8: float,
    tenure_days: int,
    personalised_weights: Optional[Dict[str, float]] = None,
) -> tuple:
    """
    Computes trust score and returns (trust_score, band, credit_action,
    counterfactual, top_signals).

    If personalised_weights is provided, uses those instead of platform prior.
    """
    signals_map = {
        'S1': s1, 'S2': s2, 'S3': s3, 'S4': s4,
        'S5': s5, 'S6': s6, 'S7': s7, 'S8': s8,
    }

    weights = personalised_weights if personalised_weights else PLATFORM_WEIGHTS

    # 1. Compute weighted sum
    risk = sum(weights[sig] * signals_map[sig] for sig in signals_map)

    # 2. Amplifier mechanism
    if risk > 0.5 and (s6 > 0.5 or s7 > 0.5):
        risk = min(1.0, risk * 1.15)

    # 3. Tenure adjustment
    if tenure_days < 90:
        premium = 0.05 * (1 - tenure_days / 90.0)
        risk = min(1.0, risk + premium)

    # 4. Trust Score
    trust_score = round((1 - risk) * 100)
    trust_score = max(0, min(100, int(trust_score)))

    # 5. Decision bands
    if trust_score >= 76:
        band = "CLEAR"
        credit_action = "full credit"
    elif trust_score >= 56:
        band = "CAUTION"
        credit_action = "no change, notify analyst"
    elif trust_score >= 36:
        band = "WARNING"
        credit_action = "credit reduced to 75%"
    elif trust_score >= 16:
        band = "RESTRICTED"
        credit_action = "credit reduced to 40%, all bookings need approval"
    else:
        band = "RESTRICTED"
        credit_action = "score critical, pending admin approval to BLOCK"

    # 6. Identify top signals
    signal_names_map = {
        'S1': 'S1 Booking Velocity', 'S2': 'S2 Refundable Ratio',
        'S3': 'S3 Lead Time', 'S4': 'S4 Cancellation Cascade',
        'S5': 'S5 Credit Utilization', 'S6': 'S6 Name Reuse',
        'S7': 'S7 Destination Spike', 'S8': 'S8 Settlement Delay',
    }

    weighted_contributions = {
        sig: weights[sig] * signals_map[sig] for sig in signals_map
    }
    sorted_signals = sorted(weighted_contributions.items(), key=lambda x: x[1], reverse=True)

    top_1_name = signal_names_map[sorted_signals[0][0]]
    top_2_name = signal_names_map[sorted_signals[1][0]]
    top_3_name = signal_names_map[sorted_signals[2][0]]

    # 7. Counterfactual guidance
    counterfactual = (
        f"To improve the score and move to a safer band, the agency needs to "
        f"lower its {top_1_name} and control its {top_2_name} patterns."
    )

    return trust_score, band, credit_action, counterfactual, [top_1_name, top_2_name, top_3_name]

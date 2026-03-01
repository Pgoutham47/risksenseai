"""
Local Investigation Engine — generates rich, structured investigation narratives
from agency signal data using pure Python logic. No API key required.
"""
import time
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Optional

router = APIRouter(prefix="/api/investigate", tags=["investigate"])

SIGNAL_NAMES = {
    'S1': 'Booking Velocity',
    'S2': 'Refundable Ratio',
    'S3': 'Lead Time Compression',
    'S4': 'Cancellation Cascade',
    'S5': 'Credit Utilization',
    'S6': 'Passenger Name Reuse',
    'S7': 'Destination Spike',
    'S8': 'Settlement Delay',
}

BAND_THRESHOLDS = {
    'CLEAR': (76, 100),
    'CAUTION': (56, 75),
    'WARNING': (36, 55),
    'RESTRICTED': (16, 35),
    'BLOCKED': (0, 15),
}

def get_band(score: int) -> str:
    for band, (lo, hi) in BAND_THRESHOLDS.items():
        if lo <= score <= hi:
            return band
    return 'BLOCKED'

def risk_level(val: float) -> str:
    if val >= 0.75: return 'CRITICAL'
    if val >= 0.55: return 'HIGH'
    if val >= 0.35: return 'ELEVATED'
    return 'LOW'

def risk_label(val: float) -> str:
    if val >= 0.75: return '🔴'
    if val >= 0.55: return '🟠'
    if val >= 0.35: return '🟡'
    return '🟢'


class InvestigateRequest(BaseModel):
    agency_name: str
    agency_id: str
    cohort: str
    tenure_days: int
    credit_limit: float
    outstanding_balance: float
    credit_utilization: float
    trust_score: int
    previous_score: int
    event_type: str
    severity: float
    custom_input: Optional[str] = None
    mode: str = 'standard'
    signals: Dict[str, float] = {}
    weights: Dict[str, Dict] = {}
    total_observations: int = 0
    learning_rate: float = 0.3

    class Config:
        extra = 'allow'


def build_investigation(req: InvestigateRequest) -> str:
    band = get_band(req.trust_score)
    prev_band = get_band(req.previous_score)
    score_delta = req.trust_score - req.previous_score
    delta_str = f"+{score_delta}" if score_delta > 0 else str(score_delta)

    # Rank signals by value
    sig_items = sorted(req.signals.items(), key=lambda x: x[1], reverse=True)
    top_signals = sig_items[:3]
    hot_signals = [(k, v) for k, v in sig_items if v >= 0.55]
    clean_signals = [(k, v) for k, v in sig_items if v < 0.3]

    # Weighted contributions
    weighted = {}
    for sig_id, val in req.signals.items():
        w_info = req.weights.get(sig_id, {})
        w = w_info.get('current', w_info.get('prior', 0.1))
        weighted[sig_id] = val * w
    top_weighted = sorted(weighted.items(), key=lambda x: x[1], reverse=True)

    # Credit info
    credit_used_pct = req.credit_utilization * 100
    available = req.credit_limit - req.outstanding_balance
    credit_action = {
        'CLEAR': 'Full credit line active. No action required.',
        'CAUTION': 'No credit change. Analyst notified for observation.',
        'WARNING': 'Credit reduced to 75% of limit. Monitoring increased.',
        'RESTRICTED': 'Credit reduced to 40%. All bookings require approval.',
        'BLOCKED': 'Credit line frozen. Immediate escalation required.',
    }.get(band, 'Review required.')

    trajectory = 'IMPROVING' if score_delta > 4 else 'DETERIORATING' if score_delta < -4 else 'STABLE'

    event_desc = req.custom_input if req.event_type == 'custom' else {
        'velocity_spike': 'Sudden spike in booking velocity detected',
        'refund_abuse': 'Unusually high refundable booking ratio observed',
        'settlement_miss': 'Settlement payment missed or significantly delayed',
        'name_reuse': 'Passenger name reuse pattern detected across bookings',
        'destination_spike': 'Abnormal concentration of bookings to a single destination',
        'credit_max': 'Credit utilization approaching or exceeding limit',
        'lead_compress': 'Extreme last-minute booking pattern observed',
        'cancel_cascade': 'Multiple sequential cancellations detected',
    }.get(req.event_type, req.event_type)

    lines = []

    # ── HEADER ──
    lines.append(f"# 🔍 Investigation Report — {req.agency_name}")
    lines.append(f"**ID:** `{req.agency_id}` | **Cohort:** {req.cohort} | **Tenure:** {req.tenure_days} days | **Observations:** {req.total_observations}")
    lines.append("")

    # ── SCORE SUMMARY ──
    lines.append("## Score Movement")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Previous Score | **{req.previous_score}** ({prev_band}) |")
    lines.append(f"| Current Score | **{req.trust_score}** ({band}) |")
    lines.append(f"| Delta | **{delta_str} pts** |")
    lines.append(f"| Trajectory | **{trajectory}** |")
    lines.append("")

    # ── TRIGGERING EVENT ──
    lines.append("## Triggering Event")
    lines.append(f"> **{event_desc}** (Severity: `{req.severity:.1f}`)")
    lines.append("")
    if req.mode == 'stress':
        lines.append(f"> ⚠️ **Stress Test Mode** — Simulating the 5th recurrence of this event.")
        lines.append(f"> The Bayesian engine has observed this pattern {req.total_observations} times. Signal weights are now highly personalised for `{req.agency_id}`.")
        lines.append("")

    # ── SIGNAL ANALYSIS ──
    lines.append("## Signal Analysis")
    lines.append("")
    for sig_id, val in sig_items:
        name = SIGNAL_NAMES.get(sig_id, sig_id)
        w_info = req.weights.get(sig_id, {})
        w = w_info.get('current', 0.1)
        prior = w_info.get('prior', 0.1)
        rel = w_info.get('reliability', 0.5)
        label = risk_label(val)
        level = risk_level(val)
        contribution = val * w
        weight_note = ''
        if abs(w - prior) > 0.05:
            direction = '↑ elevated' if w > prior else '↓ reduced'
            weight_note = f" (personalised {direction} from prior `{prior:.2f}`)"

        lines.append(f"**{label} {sig_id} — {name}** `{val:.2f}` → {level}")
        lines.append(f"- Weight: `{w:.2f}`{weight_note} | Reliability: `{rel:.2f}` | Weighted contribution: `{contribution:.3f}`")

        if val >= 0.75:
            lines.append(f"- 🔴 Critical threshold exceeded. This signal is the primary driver of risk for `{req.agency_id}`.")
        elif val >= 0.55:
            lines.append(f"- 🟠 High activity. Warrants close monitoring in conjunction with other signals.")
        elif val >= 0.35:
            lines.append(f"- 🟡 Elevated, but within tolerable range for this cohort ({req.cohort}).")
        else:
            lines.append(f"- 🟢 Within normal operating bounds. No concern at current levels.")
        lines.append("")

    # ── HYPOTHESES ──
    lines.append("## Hypotheses")
    lines.append("")

    if len(hot_signals) >= 2:
        h1_sigs = ', '.join([f"{SIGNAL_NAMES.get(k,k)} ({v:.2f})" for k, v in hot_signals[:2]])
        lines.append(f"### H1 — Coordinated Fraud Pattern (Confidence: High)")
        lines.append(f"Multiple high-risk signals active simultaneously: **{h1_sigs}**.")
        lines.append(f"When two or more signals breach 0.55 concurrently, the engine's amplifier activates (+15% risk penalty). This agency meets that threshold.")
        lines.append("")

    top_w_name = SIGNAL_NAMES.get(top_weighted[0][0], top_weighted[0][0]) if top_weighted else 'Unknown'
    lines.append(f"### H2 — Isolated {top_w_name} Anomaly (Confidence: Medium)")
    lines.append(f"The primary weighted contributor is **{top_w_name}** (`{top_weighted[0][1]:.3f}` weighted risk). This agency ({req.tenure_days} days tenure) may be experiencing unusual but not necessarily fraudulent activity.")
    if req.tenure_days < 90:
        lines.append(f"**Note:** New agency premium is active (< 90 days). A 5% additional risk penalty is applied, which could explain some of the score degradation even without a pattern change.")
    lines.append("")

    if clean_signals:
        clean_names = ', '.join([SIGNAL_NAMES.get(k, k) for k, _ in clean_signals[:3]])
        lines.append(f"### H3 — Localised Signal, Not Systemic (Confidence: Low-Medium)")
        lines.append(f"Signals {clean_names} remain **clean** ({', '.join([f'{v:.2f}' for _, v in clean_signals[:3]])}), which argues against a systemic fraud pattern. A single bad-actor signal with clean counterparts is more consistent with operational error than fraud.")
        lines.append("")

    # ── BAYESIAN CONTEXT ──
    lines.append("## Bayesian Engine Context")
    lines.append("")
    if req.total_observations < 20:
        lines.append(f"> ⚠️ **Low Confidence Mode** — Only `{req.total_observations}` observations. The engine is relying heavily on platform priors. Weights will evolve significantly as more outcomes are recorded.")
    elif req.total_observations < 80:
        lines.append(f"> 🔄 **Learning Phase** — `{req.total_observations}` observations. Weights are diverging from priors. Learning rate: `{req.learning_rate}`. The engine is beginning to personalise for `{req.agency_id}`.")
    else:
        lines.append(f"> ✅ **High Confidence Mode** — `{req.total_observations}` observations. Personalised weights are well-established. Learning rate: `{req.learning_rate}`. The engine's decisions carry high signal reliability.")
    lines.append("")

    if req.mode == 'deep':
        lines.append("### Deep Weight Breakdown")
        for sig_id, _ in sorted(weighted.items(), key=lambda x: x[1], reverse=True)[:4]:
            w_info = req.weights.get(sig_id, {})
            lines.append(f"- **{sig_id} {SIGNAL_NAMES.get(sig_id, '')}**: weight `{w_info.get('current', 0):.3f}` | F1 reliability `{w_info.get('reliability', 0):.2f}` | TP:{w_info.get('tp',0)} FP:{w_info.get('fp',0)} TN:{w_info.get('tn',0)} FN:{w_info.get('fn',0)}")
        lines.append("")

    # ── CREDIT DECISION ──
    lines.append("## Credit Decision")
    lines.append("")
    lines.append(f"**Band:** `{band}` | **Credit Limit:** ₹{req.credit_limit:,.0f} | **Outstanding:** ₹{req.outstanding_balance:,.0f} | **Utilization:** {credit_used_pct:.1f}%")
    lines.append("")
    lines.append(f"> {credit_action}")
    lines.append("")

    # ── RECOMMENDED ACTIONS ──
    lines.append("## Recommended Actions")
    lines.append("")
    if band == 'CLEAR':
        lines.append("1. ✅ No action required. Continue monitoring.")
        lines.append("2. Schedule next automated assessment in 24 hours.")
    elif band == 'CAUTION':
        lines.append(f"1. 🔔 Notify assigned analyst for `{req.agency_id}` for awareness — no credit change.")
        lines.append(f"2. Increase monitoring cadence to 4-hour intervals.")
        lines.append(f"3. Flag for review if score drops below 60 within next 48 hours.")
    elif band == 'WARNING':
        lines.append(f"1. ⚠️ Reduce available credit to 75% of limit (₹{req.credit_limit * 0.75:,.0f}).")
        lines.append(f"2. Require analyst sign-off for any new bookings above ₹{req.credit_limit * 0.1:,.0f}.")
        lines.append(f"3. Trigger outreach to {req.agency_name} account manager.")
        lines.append(f"4. Target signal to reduce: **{SIGNAL_NAMES.get(top_signals[0][0], 'S1')}** currently at `{top_signals[0][1]:.2f}`.")
    elif band == 'RESTRICTED':
        lines.append(f"1. 🔴 Reduce credit immediately to 40% (₹{req.credit_limit * 0.4:,.0f}).")
        lines.append(f"2. All bookings from `{req.agency_id}` require manual approval before processing.")
        lines.append(f"3. Escalate to Senior Risk Analyst within 2 hours.")
        lines.append(f"4. Request explanation from agency for: **{event_desc}**.")
    else:  # BLOCKED
        lines.append(f"1. 🚨 Freeze credit line immediately.")
        lines.append(f"2. Escalate to Risk Operations team — do not process any new transactions.")
        lines.append(f"3. Initiate formal investigation protocol for `{req.agency_id}`.")
        lines.append(f"4. Preserve all audit trail records for the last 30 days.")
    lines.append("")

    # ── RECOVERY PATH ──
    lines.append("## Recovery Path")
    lines.append("")
    if band != 'CLEAR':
        primary_sig = top_signals[0] if top_signals else ('S1', 0.5)
        secondary_sig = top_signals[1] if len(top_signals) > 1 else ('S2', 0.4)
        current_band_lo = BAND_THRESHOLDS[band][0]
        next_band = {
            'RESTRICTED': 'WARNING (36+)',
            'WARNING': 'CAUTION (56+)',
            'CAUTION': 'CLEAR (76+)',
            'BLOCKED': 'RESTRICTED (16+)',
        }.get(band, 'CLEAR')
        lines.append(f"To move from **{band}** to **{next_band}**, the agency must demonstrate:")
        lines.append(f"- Reduction in **{SIGNAL_NAMES.get(primary_sig[0], primary_sig[0])}** from `{primary_sig[1]:.2f}` to below `0.35`")
        lines.append(f"- Stabilisation of **{SIGNAL_NAMES.get(secondary_sig[0], secondary_sig[0])}** at `{secondary_sig[1]:.2f}` → target `< 0.4`")
        lines.append(f"- Consistent behaviour for a minimum of 5 consecutive assessment cycles")
        if req.outstanding_balance > req.credit_limit * 0.7:
            lines.append(f"- Settlement of outstanding balance (currently ₹{req.outstanding_balance:,.0f}) to below 50% of limit")
    else:
        lines.append("Agency is in the **CLEAR** band. Maintain current behaviour to preserve trust score.")
    lines.append("")
    lines.append("---")
    lines.append(f"*Investigation generated by RiskSense Engine v2.0 | Bayesian mode: {'active' if req.total_observations > 0 else 'prior-only'} | Mode: {req.mode.upper()}*")

    return '\n'.join(lines)


@router.post("/run")
async def run_investigation(req: InvestigateRequest):
    """Generate an investigation narrative and stream it character by character."""

    report = build_investigation(req)

    async def stream_report():
        # Stream word by word for a typewriter effect
        words = report.split(' ')
        for i, word in enumerate(words):
            chunk = word + (' ' if i < len(words) - 1 else '')
            data = json.dumps({"text": chunk})
            yield f"data: {data}\n\n"
            # Tiny delay for typewriter effect
            time.sleep(0.012)
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_report(), media_type="text/event-stream")

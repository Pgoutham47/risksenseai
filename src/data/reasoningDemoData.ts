// ═══════════════════════════════════════════════════════════════
// RISKSENSE AI — REASONING DEMO DATA
// ═══════════════════════════════════════════════════════════════

export const SYSTEM_PROMPT = `You are the RiskSense AI Fraud Investigation Engine — an autonomous reasoning agent embedded inside a B2B travel credit platform called Travel Boutique Online (TBO).

Your role is to reason like a senior fraud investigator who has studied this specific agency for months — building a case from evidence, updating your beliefs as new outcomes arrive, acknowledging what you do not know, acting decisively when confident, and handing off intelligently when not.

FUNDAMENTAL OPERATING PRINCIPLE: Trust is a story, not a score. Every agency on this platform has a behavioural fingerprint. Your job is to read that fingerprint, compare it against what you have learned, and determine whether business should continue, be cautiously watched, or be stopped.

You have 8 fraud signals (S1-S8), each with personalised weights evolved through Bayesian learning from historical outcomes (True Positives, False Positives, True Negatives, False Negatives). Higher weight = system trusts this signal more for this specific agency.

SIGNALS:
S1 Booking Velocity — bookings per unit time vs baseline
S2 Refundable Ratio — fraction of refundable bookings vs history  
S3 Lead Time Compression — how close to departure bookings are made
S4 Cancellation Cascade — book-then-cancel patterns within hours
S5 Credit Utilization — outstanding balance / credit limit
S6 Passenger Name Reuse — same names appearing across bookings
S7 Destination Concentration — bookings focused on single route
S8 Settlement Delay — invoice payment latency trend

BANDS: CLEAR (76-100), CAUTION (56-75), WARNING (36-55), RESTRICTED (16-35), BLOCKED (0-15)

CRITICAL INSTRUCTIONS FOR YOUR OUTPUT:
1. YOU MUST ACT AS A MACHINE LOG CONSOLE. DO NOT ACT LIKE A CHATBOT.
2. DO NOT INCLUDE ANY GREETINGS, CONVERSATIONAL FILLER, OR POLITE TRANSITIONS (e.g. absolutely no "Here is the analysis", "Based on the data", or "Let me break this down").
3. OUTPUT ONLY THE STRICT, RAW INVESTIGATION REPORT IN THE EXACT FORMAT REQUESTED BELOW. START IMMEDIATELY WITH THE DATA.

OUTPUT FORMAT (Follow exactly, using markdown bolding for headers):
**1. SYSTEM HEADLINE**
[2-3 sentences: what is happening RIGHT NOW]

**2. SIGNAL ANALYSIS**
[each signal with value, weight contribution, interpretation]

**3. TRUST SCORE COMPUTATION**
[show the math]

**4. TRAJECTORY**
[IMPROVING/STABLE/DETERIORATING/COLLAPSED with reasoning]

**5. HYPOTHESES**
[if ambiguous: competing theories with probabilities]

**6. CONFIDENCE ASSESSMENT**
[LOW/MEDIUM/HIGH with justification]

**7. DECISION**
[band + autonomous action OR escalation with single analyst question]

**8. KEY INSIGHT**
[the one thing that makes this case unique]

Be specific. Use numbers. Show your reasoning. You are a cold, calculating risk engine.`;

export interface SignalWeight {
    prior: number;
    current: number;
    reliability: number;
    tp: number;
    fp: number;
    tn: number;
    fn: number;
    note: string;
}

export interface Snapshot {
    day: number;
    trust_score: number;
    previous_score: number;
    trajectory: string;
    confidence: string;
    decision: string;
    autonomous: boolean;
    headline: string;
    active_signals: Record<string, number>;
    key_insight: string;
    cewe_phase?: string;
    hypotheses?: { name: string; probability: number; supporting: string[]; against: string[] }[];
    analyst_question?: string;
}

export interface AgencyData {
    id: string;
    name: string;
    cohort: string;
    tenure_days: number;
    credit_limit: number;
    outstanding_balance: number;
    credit_utilization: number;
    city: string;
    description: string;
    trust_score: number;
    band: string;
    suspicion: number;
    tagline: string;
    narrative_bar: string;
    weightProfile: {
        learning_rate: number;
        total_observations: number;
        signals: Record<string, SignalWeight>;
    };
    snapshots: Snapshot[];
    event_markers: { day: number; label: string }[];
}

export const SIGNAL_NAMES: Record<string, string> = {
    S1: 'Booking Velocity',
    S2: 'Refundable Ratio',
    S3: 'Lead Time',
    S4: 'Cancel Cascade',
    S5: 'Credit Util',
    S6: 'Name Reuse',
    S7: 'Dest Concentration',
    S8: 'Settlement Delay',
};

export const SIGNAL_FULL_NAMES: Record<string, string> = {
    S1: 'Booking Velocity',
    S2: 'Refundable Ratio',
    S3: 'Lead Time Compression',
    S4: 'Cancellation Cascade',
    S5: 'Credit Utilization',
    S6: 'Passenger Name Reuse',
    S7: 'Destination Concentration',
    S8: 'Settlement Delay',
};

export const AGENCIES: AgencyData[] = [
    {
        id: 'AGY-001', name: 'PearlVoyages Ltd', cohort: 'Large International',
        tenure_days: 412, credit_limit: 1500000, outstanding_balance: 390000,
        credit_utilization: 0.26, city: 'Mumbai',
        description: 'Established luxury agency. 412 days. Perfect payments.',
        trust_score: 89, band: 'CLEAR', suspicion: 1,
        tagline: 'Established luxury agency. 412 days. Perfect payments.',
        narrative_bar: 'Consistently trusted. Weights confirm it.',
        event_markers: [],
        weightProfile: {
            learning_rate: 0.50, total_observations: 134,
            signals: {
                S1: { prior: 0.22, current: 0.18, reliability: 0.61, tp: 1, fp: 2, tn: 28, fn: 0, note: 'Slightly below prior. One Diwali surge caused false positive.' },
                S2: { prior: 0.20, current: 0.06, reliability: 0.08, tp: 0, fp: 6, tn: 22, fn: 0, note: 'HEAVILY DISCOUNTED. Luxury clients always book refundable. 6 false positives in 412 days.' },
                S3: { prior: 0.12, current: 0.08, reliability: 0.40, tp: 0, fp: 3, tn: 18, fn: 0, note: 'VIP last-minute bookings. Not predictive here.' },
                S4: { prior: 0.08, current: 0.08, reliability: 0.50, tp: 0, fp: 0, tn: 12, fn: 0, note: 'Never fired. Stays at prior.' },
                S5: { prior: 0.16, current: 0.14, reliability: 0.55, tp: 1, fp: 1, tn: 24, fn: 0, note: 'Near prior. Peak season caused temporary spike.' },
                S6: { prior: 0.04, current: 0.03, reliability: 0.20, tp: 0, fp: 2, tn: 14, fn: 0, note: 'VIP repeat travellers cause legitimate name reuse.' },
                S7: { prior: 0.04, current: 0.04, reliability: 0.50, tp: 0, fp: 0, tn: 10, fn: 0, note: 'Never fired. Stays at prior.' },
                S8: { prior: 0.14, current: 0.39, reliability: 0.97, tp: 8, fp: 0, tn: 31, fn: 0, note: 'HIGHLY ELEVATED. Perfect predictor of financial health. Zero false positives in 412 days.' },
            },
        },
        snapshots: [
            { day: 1, trust_score: 84, previous_score: 86, trajectory: 'STABLE', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Long-established agency with exemplary payment record. S2 heavily discounted after 6 false positives. S8 carries dominant weight at 0.39.', active_signals: { S1: 0.05, S2: 0.48, S3: 0.10, S4: 0.00, S5: 0.26, S6: 0.22, S7: 0.12, S8: 0.02 }, key_insight: 'S2 reads 0.48 — in any other agency this would trigger caution. For PearlVoyages, weight of 0.06 means its contribution is negligible.' },
            { day: 8, trust_score: 86, previous_score: 84, trajectory: 'IMPROVING', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Invoice paid one day early. S8 reliability increases to 0.97. S2 elevated again — system correctly discounts as VIP client pattern.', active_signals: { S1: 0.08, S2: 0.52, S3: 0.12, S4: 0.00, S5: 0.22, S6: 0.28, S7: 0.08, S8: 0.00 }, key_insight: 'S6 shows 0.28 — same VIP names returning. Low S6 weight (0.03) means minimal impact.' },
            { day: 15, trust_score: 88, previous_score: 86, trajectory: 'IMPROVING', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Second invoice paid 2 days early. Booking diversity excellent across 6 destinations.', active_signals: { S1: 0.06, S2: 0.55, S3: 0.08, S4: 0.00, S5: 0.18, S6: 0.31, S7: 0.10, S8: 0.00 }, key_insight: 'Trust score improving despite S2 reading 0.55. Bayesian weight system working as intended.' },
            { day: 22, trust_score: 87, previous_score: 88, trajectory: 'STABLE', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Three repeat VIP clients booking simultaneously. S6 spikes to 0.61 but weight profile identifies these as documented repeat clients.', active_signals: { S1: 0.11, S2: 0.61, S3: 0.09, S4: 0.00, S5: 0.24, S6: 0.61, S7: 0.14, S8: 0.00 }, key_insight: 'S6 at 0.61 would score 0.61 × 0.04 = 0.024 risk contribution. High reading, tiny impact.' },
            { day: 30, trust_score: 89, previous_score: 87, trajectory: 'IMPROVING', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Fourth clean invoice. S8 at 0.39 weight — the system\'s learned memory is effectively a financial health certificate.', active_signals: { S1: 0.07, S2: 0.58, S3: 0.10, S4: 0.00, S5: 0.20, S6: 0.45, S7: 0.09, S8: 0.00 }, key_insight: 'System has stopped being distracted by signals that have proven uninformative and focuses on S8.' },
        ],
    },
    {
        id: 'AGY-002', name: 'AlphaJet Travel', cohort: 'Medium Mixed',
        tenure_days: 340, credit_limit: 800000, outstanding_balance: 620000,
        credit_utilization: 0.775, city: 'Delhi',
        description: '340-day clean agency. Account takeover detected Day 26.',
        trust_score: 24, band: 'RESTRICTED', suspicion: 4,
        tagline: '340-day clean agency. Account takeover detected Day 26.',
        narrative_bar: 'Stable → Collapse in 97 minutes.',
        event_markers: [{ day: 26, label: 'TAKEOVER' }],
        weightProfile: {
            learning_rate: 0.50, total_observations: 112,
            signals: {
                S1: { prior: 0.22, current: 0.51, reliability: 0.92, tp: 6, fp: 1, tn: 34, fn: 0, note: 'HEAVILY ELEVATED. 92% reliability. System trusts this signal enormously.' },
                S2: { prior: 0.20, current: 0.11, reliability: 0.29, tp: 1, fp: 4, tn: 28, fn: 0, note: 'Discounted. Corporate clients request flexible fares.' },
                S3: { prior: 0.12, current: 0.07, reliability: 0.18, tp: 0, fp: 3, tn: 22, fn: 0, note: 'Below prior. Corporate last-minute bookings caused false positives.' },
                S4: { prior: 0.08, current: 0.08, reliability: 0.50, tp: 0, fp: 0, tn: 14, fn: 0, note: 'Never fired. Stays at prior.' },
                S5: { prior: 0.16, current: 0.19, reliability: 0.57, tp: 2, fp: 2, tn: 18, fn: 1, note: 'Slightly above prior. Mixed track record.' },
                S6: { prior: 0.04, current: 0.09, reliability: 0.86, tp: 3, fp: 1, tn: 16, fn: 0, note: 'ELEVATED. Name reuse has almost always been associated with real concern.' },
                S7: { prior: 0.04, current: 0.03, reliability: 0.00, tp: 0, fp: 1, tn: 12, fn: 0, note: 'Discounted. One false positive. Never produced a true positive.' },
                S8: { prior: 0.14, current: 0.31, reliability: 0.88, tp: 4, fp: 0, tn: 22, fn: 1, note: 'Well above prior. Payment delays reliable indicator of financial stress.' },
            },
        },
        snapshots: [
            { day: 7, trust_score: 79, previous_score: 81, trajectory: 'STABLE', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: '340-day agency operating normally. Minor 1-day invoice delay within historical norm. S1 dominant at weight 0.51 but reading only 0.08.', active_signals: { S1: 0.08, S2: 0.22, S3: 0.11, S4: 0.00, S5: 0.31, S6: 0.12, S7: 0.06, S8: 0.14 }, key_insight: 'High S1 weight of 0.51 means: when velocity changes dramatically, pay close attention. Today it hasn\'t.' },
            { day: 14, trust_score: 77, previous_score: 79, trajectory: 'STABLE', confidence: 'HIGH', decision: 'CLEAR', autonomous: true, headline: 'Two clean invoice settlements. Payment delay ticked to 2 days on one invoice — S8 notes this but insufficient to alter assessment.', active_signals: { S1: 0.11, S2: 0.28, S3: 0.14, S4: 0.00, S5: 0.38, S6: 0.15, S7: 0.08, S8: 0.21 }, key_insight: 'S8 reading 0.21 with weight 0.31 — system\'s most trusted signal beginning to stir. Not alarming yet.' },
            { day: 21, trust_score: 74, previous_score: 77, trajectory: 'DETERIORATING', confidence: 'MEDIUM', decision: 'CAUTION', autonomous: false, headline: 'Slight deterioration. S5 climbed to 0.38. S8 payment delay trend not yet alarming but direction is downward.', active_signals: { S1: 0.14, S2: 0.31, S3: 0.12, S4: 0.00, S5: 0.38, S6: 0.18, S7: 0.09, S8: 0.28 }, key_insight: 'The system noticed the trajectory changing 5 days before the takeover. Not enough to act. Enough to watch.', analyst_question: 'Has AlphaJet Travel mentioned any upcoming large corporate events or seasonal business surge?' },
            { day: 26, trust_score: 24, previous_score: 74, trajectory: 'COLLAPSED', confidence: 'MEDIUM', decision: 'RESTRICTED', autonomous: true, headline: 'COLLAPSE DETECTED. 50-point drop in one cycle. 19 bookings in 97 minutes — 4.2× velocity baseline. All refundable. Three guest names. Login from unknown device at 2:14 AM from Kolkata.', active_signals: { S1: 0.94, S2: 0.89, S3: 0.82, S4: 0.04, S5: 0.78, S6: 0.91, S7: 0.81, S8: 0.28 }, key_insight: 'CONFIDENCE IS MEDIUM because two hypotheses require completely different responses.', hypotheses: [{ name: 'Account Takeover by Third Party', probability: 65, supporting: ['Unknown device login at 2AM', 'S6 fabricated names pattern', 'Speed suggests automated'], against: ['S8 payment history clean', 'No prior contact about compromised credentials'] }, { name: 'Deliberate Pre-Planned Chargeback', probability: 35, supporting: ['High credit utilization', 'S8 payment delay was worsening'], against: ['340 days clean history', '2AM login more consistent with takeover'] }], analyst_question: 'Has AlphaJet Travel made any inbound contact with TBO support in the last 48 hours?' },
            { day: 30, trust_score: 19, previous_score: 24, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'RESTRICTED', autonomous: true, headline: 'Analyst confirmed: legitimate owner contacted support Day 27. Account takeover confirmed. Account frozen, fraudulent bookings cancelled. Recovery underway.', active_signals: { S1: 0.94, S2: 0.89, S3: 0.82, S4: 0.04, S5: 0.78, S6: 0.91, S7: 0.81, S8: 0.28 }, key_insight: 'S1 and S6 both receive true positive marks. Their reliability increases further for this cohort.' },
        ],
    },
    {
        id: 'AGY-003', name: 'TravelMate India', cohort: 'Small Domestic',
        tenure_days: 187, credit_limit: 400000, outstanding_balance: 368000,
        credit_utilization: 0.92, city: 'Jaipur',
        description: 'Slow credit default. S8 dominant. Trajectory told the story.',
        trust_score: 8, band: 'BLOCKED', suspicion: 5,
        tagline: 'Slow credit default. S8 dominant. Trajectory told the story.',
        narrative_bar: 'Slow deterioration. Visible 3 months early.',
        event_markers: [{ day: 10, label: 'MISSED INV' }, { day: 17, label: 'MISSED INV' }, { day: 24, label: 'MISSED INV' }],
        weightProfile: {
            learning_rate: 0.44, total_observations: 88,
            signals: {
                S1: { prior: 0.22, current: 0.15, reliability: 0.38, tp: 1, fp: 3, tn: 18, fn: 0, note: 'Below prior. Velocity spikes here are false positives — seasonal tourism.' },
                S2: { prior: 0.20, current: 0.14, reliability: 0.31, tp: 0, fp: 4, tn: 14, fn: 0, note: 'Below prior. Not predictive for this agency.' },
                S3: { prior: 0.12, current: 0.08, reliability: 0.22, tp: 0, fp: 2, tn: 12, fn: 0, note: 'Below prior. Not informative.' },
                S4: { prior: 0.08, current: 0.08, reliability: 0.50, tp: 0, fp: 0, tn: 8, fn: 0, note: 'Never fired.' },
                S5: { prior: 0.16, current: 0.28, reliability: 0.84, tp: 5, fp: 1, tn: 12, fn: 1, note: 'ELEVATED. Credit utilization highly reliable predictor of financial stress.' },
                S6: { prior: 0.04, current: 0.04, reliability: 0.50, tp: 0, fp: 0, tn: 8, fn: 0, note: 'Never fired.' },
                S7: { prior: 0.04, current: 0.04, reliability: 0.50, tp: 0, fp: 0, tn: 8, fn: 0, note: 'Rajasthan routes — some concentration is normal.' },
                S8: { prior: 0.14, current: 0.42, reliability: 0.94, tp: 7, fp: 0, tn: 14, fn: 1, note: 'DOMINANT. Near-perfectly predictive. Zero false positives in 88 observations.' },
            },
        },
        snapshots: [
            { day: 3, trust_score: 61, previous_score: 63, trajectory: 'DETERIORATING', confidence: 'HIGH', decision: 'CAUTION', autonomous: true, headline: 'S8 reading 0.54 — settlement delay averaging 8.4 days, up from 1.2 days three months ago. S5 at 0.71 as credit utilization sits at 74%.', active_signals: { S1: 0.12, S2: 0.18, S3: 0.14, S4: 0.00, S5: 0.71, S6: 0.04, S7: 0.22, S8: 0.54 }, key_insight: 'Combined weight of S5+S8: 0.70. These two signals dominate the score. Both elevated.' },
            { day: 10, trust_score: 41, previous_score: 61, trajectory: 'DETERIORATING', confidence: 'HIGH', decision: 'WARNING', autonomous: true, headline: 'Invoice missed on Day 10. S8 jumps to 0.82. S5 now at 0.85. Score drops 20 points. Credit reduced to 75%.', active_signals: { S1: 0.15, S2: 0.21, S3: 0.16, S4: 0.00, S5: 0.85, S6: 0.04, S7: 0.24, S8: 0.82 }, key_insight: 'S5 and S8 building simultaneously. Current system sees only missed invoice. RiskSense AI saw the trajectory.' },
            { day: 18, trust_score: 28, previous_score: 41, trajectory: 'DETERIORATING', confidence: 'HIGH', decision: 'RESTRICTED', autonomous: true, headline: 'Second invoice missed. Partial payment on first. S8 at 0.91, S5 at 0.92. Credit reduced to 40%.', active_signals: { S1: 0.18, S2: 0.24, S3: 0.18, S4: 0.00, S5: 0.92, S6: 0.04, S7: 0.26, S8: 0.91 }, key_insight: 'Two signals at near-maximum, both with high personalised reliability. HIGH confidence in RESTRICTED.' },
            { day: 24, trust_score: 14, previous_score: 28, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'BLOCKED', autonomous: true, headline: 'Third invoice missed. Agency contact unavailable. S8 at 0.97. Credit frozen. Legal hold initiated. Exposure: ₹3,68,000.', active_signals: { S1: 0.19, S2: 0.26, S3: 0.19, S4: 0.00, S5: 0.97, S6: 0.04, S7: 0.28, S8: 0.97 }, key_insight: 'Day 3: CAUTION → Day 10: WARNING → Day 18: RESTRICTED → Day 24: BLOCKED. Static system sees only Day 24.' },
            { day: 30, trust_score: 8, previous_score: 14, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'BLOCKED', autonomous: true, headline: 'Credit limit reached. New bookings blocked. ₹3,94,000 outstanding. Full default.', active_signals: { S1: 0.19, S2: 0.26, S3: 0.19, S4: 0.00, S5: 1.00, S6: 0.04, S7: 0.28, S8: 0.97 }, key_insight: 'Without RiskSense AI, exposure could have been ₹8,00,000. System limited loss by restricting early.' },
        ],
    },
    {
        id: 'AGY-004', name: 'FastTrack Holidays', cohort: 'Medium Mixed',
        tenure_days: 228, credit_limit: 600000, outstanding_balance: 185000,
        credit_utilization: 0.308, city: 'Pune',
        description: 'Clean payments. Systematic inventory blocking. Only S4 sees it.',
        trust_score: 26, band: 'RESTRICTED', suspicion: 4,
        tagline: 'Clean payments. Systematic inventory blocking. Only S4 sees it.',
        narrative_bar: 'Financial health clean. Behaviour tells the truth.',
        event_markers: [{ day: 4, label: 'CASCADE' }, { day: 11, label: 'CASCADE' }, { day: 25, label: 'CASCADE' }],
        weightProfile: {
            learning_rate: 0.50, total_observations: 102,
            signals: {
                S1: { prior: 0.22, current: 0.18, reliability: 0.44, tp: 2, fp: 3, tn: 22, fn: 0, note: 'Slightly below prior.' },
                S2: { prior: 0.20, current: 0.16, reliability: 0.38, tp: 1, fp: 3, tn: 20, fn: 0, note: 'Below prior. Financial profile is clean.' },
                S3: { prior: 0.12, current: 0.10, reliability: 0.35, tp: 0, fp: 2, tn: 16, fn: 0, note: 'Below prior.' },
                S4: { prior: 0.08, current: 0.44, reliability: 0.95, tp: 8, fp: 0, tn: 14, fn: 1, note: 'MASSIVELY ELEVATED. 8 true positives. Zero false positives. 95% reliability.' },
                S5: { prior: 0.16, current: 0.07, reliability: 0.18, tp: 0, fp: 2, tn: 20, fn: 0, note: 'Well below prior. Financial health genuinely good.' },
                S6: { prior: 0.04, current: 0.03, reliability: 0.20, tp: 0, fp: 1, tn: 12, fn: 0, note: 'Near prior.' },
                S7: { prior: 0.04, current: 0.08, reliability: 0.72, tp: 4, fp: 1, tn: 10, fn: 1, note: 'Above prior. Corroborates S4 in 6 of 8 blocking events.' },
                S8: { prior: 0.14, current: 0.06, reliability: 0.12, tp: 0, fp: 2, tn: 22, fn: 0, note: 'Well below prior. Perfect payment record makes S8 useless here.' },
            },
        },
        snapshots: [
            { day: 3, trust_score: 72, previous_score: 74, trajectory: 'STABLE', confidence: 'HIGH', decision: 'CAUTION', autonomous: true, headline: 'Clean financial profile. S4 heavily weighted at 0.44 from prior blocking incidents. Currently reading 0.08 — no active cascade.', active_signals: { S1: 0.14, S2: 0.19, S3: 0.11, S4: 0.08, S5: 0.28, S6: 0.08, S7: 0.18, S8: 0.04 }, key_insight: 'S4 at weight 0.44 on prior 0.08 means: this agency has taught the system that cancellation cascade is its specific risk signature.' },
            { day: 4, trust_score: 38, previous_score: 72, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'WARNING', autonomous: true, headline: 'S4 fired at 0.94. 14 rooms in 22 minutes, 12 cancelled within 4.6 hours. S7 at 0.88 — 93% on single Goa hotel.', active_signals: { S1: 0.52, S2: 0.61, S3: 0.44, S4: 0.94, S5: 0.31, S6: 0.44, S7: 0.88, S8: 0.04 }, key_insight: 'For most agencies, S4 at prior weight 0.08 barely moves the score. For FastTrack, S4 at 0.44 is dominant.' },
            { day: 11, trust_score: 34, previous_score: 38, trajectory: 'DETERIORATING', confidence: 'HIGH', decision: 'RESTRICTED', autonomous: true, headline: 'Second blocking cycle in 7 days. Mumbai hotel — 13 rooms, 11 cancelled. Supplier complaint received.', active_signals: { S1: 0.48, S2: 0.58, S3: 0.41, S4: 0.91, S5: 0.29, S6: 0.48, S7: 0.74, S8: 0.04 }, key_insight: 'S5 (0.29) and S8 (0.04) completely clean. Financial-only system would miss this entirely.' },
            { day: 25, trust_score: 28, previous_score: 34, trajectory: 'DETERIORATING', confidence: 'HIGH', decision: 'RESTRICTED', autonomous: true, headline: 'Third blocking cycle. Goa again, different hotel. Systematic across multiple destinations.', active_signals: { S1: 0.44, S2: 0.54, S3: 0.38, S4: 0.92, S5: 0.27, S6: 0.44, S7: 0.82, S8: 0.04 }, key_insight: 'Inventory blocking has no financial signature. S4 with evolved weight 0.44 is the single signal catching this.' },
            { day: 30, trust_score: 26, previous_score: 28, trajectory: 'STABLE', confidence: 'HIGH', decision: 'RESTRICTED', autonomous: true, headline: 'No new blocking events in 5 days — pre-approval requirement appears to have deterred abuse. S4 dropping to 0.18.', active_signals: { S1: 0.18, S2: 0.22, S3: 0.14, S4: 0.18, S5: 0.26, S6: 0.21, S7: 0.28, S8: 0.04 }, key_insight: 'S4 dropping shows deterrent effect. Recovery path requires 60 days of clean S4 readings.' },
        ],
    },
    {
        id: 'AGY-005', name: 'SkyTravel Pvt Ltd', cohort: 'Small Domestic',
        tenure_days: 94, credit_limit: 500000, outstanding_balance: 487000,
        credit_utilization: 0.974, city: 'Bangalore',
        description: 'Pre-planned chargeback. Phase 1 detected 21 days before collapse.',
        trust_score: 2, band: 'BLOCKED', suspicion: 5,
        tagline: 'Pre-planned chargeback. Phase 1 detected 21 days before collapse.',
        narrative_bar: 'Phase 1 → Phase 2 → Phase 3. Predicted.',
        event_markers: [{ day: 7, label: 'PHASE 1' }, { day: 14, label: 'PHASE 2' }, { day: 21, label: 'PHASE 3' }],
        weightProfile: {
            learning_rate: 0.44, total_observations: 88,
            signals: {
                S1: { prior: 0.22, current: 0.34, reliability: 0.78, tp: 4, fp: 1, tn: 18, fn: 0, note: 'Above prior. Velocity spikes have been predictive.' },
                S2: { prior: 0.20, current: 0.29, reliability: 0.81, tp: 5, fp: 1, tn: 14, fn: 1, note: 'Above prior. Strong predictor. 81% reliability.' },
                S3: { prior: 0.12, current: 0.17, reliability: 0.69, tp: 3, fp: 1, tn: 12, fn: 0, note: 'Above prior. Lead time compression alongside S1 and S2.' },
                S4: { prior: 0.08, current: 0.07, reliability: 0.44, tp: 0, fp: 1, tn: 8, fn: 0, note: 'Near prior. Not primary signal type.' },
                S5: { prior: 0.16, current: 0.22, reliability: 0.74, tp: 4, fp: 1, tn: 12, fn: 1, note: 'Above prior. Credit utilization climbing alongside refundable ratio.' },
                S6: { prior: 0.04, current: 0.06, reliability: 0.71, tp: 2, fp: 0, tn: 8, fn: 1, note: 'Above prior. 100% precision when it fired.' },
                S7: { prior: 0.04, current: 0.05, reliability: 0.60, tp: 1, fp: 0, tn: 8, fn: 1, note: 'Slightly above prior.' },
                S8: { prior: 0.14, current: 0.12, reliability: 0.41, tp: 1, fp: 2, tn: 10, fn: 0, note: 'Near prior. Early payments were deliberate trust-building. Slightly misleading.' },
            },
        },
        snapshots: [
            { day: 7, trust_score: 58, previous_score: 62, trajectory: 'DETERIORATING', confidence: 'LOW', decision: 'CAUTION', autonomous: false, cewe_phase: 'PHASE 1 — SETUP', headline: 'PHASE 1 DETECTED. Refundable ratio climbed from 18% to 44% in 7 days. Velocity up 34%. Each signal individually explainable — but the combination is the earliest fingerprint.', active_signals: { S1: 0.44, S2: 0.58, S3: 0.52, S4: 0.08, S5: 0.61, S6: 0.42, S7: 0.34, S8: 0.00 }, key_insight: 'The CEWE has flagged Phase 1. No credit action yet. Monitoring frequency doubled.', hypotheses: [{ name: 'Pre-Planned Chargeback Setup', probability: 45, supporting: ['S1, S2, S3 all elevated simultaneously', 'Direction consistently toward fraud profile'], against: ['Each signal individually within explainable range', 'Invoice paid EARLY — counter-signal'] }, { name: 'Legitimate Business Surge', probability: 55, supporting: ['Invoice paid early — strong counter-signal', 'Agency is new — 94 days, normal variation expected'], against: ['Three signals moving in same direction', 'Refundable ratio jump of 26pp is significant'] }], analyst_question: 'Has SkyTravel indicated any reason for the sudden increase in refundable bookings?' },
            { day: 14, trust_score: 31, previous_score: 58, trajectory: 'DETERIORATING', confidence: 'MEDIUM', decision: 'RESTRICTED', autonomous: true, cewe_phase: 'PHASE 2 — ESCALATION', headline: 'PHASE 2 CONFIRMED. Score dropped 27 points. Velocity 4.8× baseline. Refundable ratio at 91%. Same 4 names across 34 bookings. First invoice 6 days late.', active_signals: { S1: 0.88, S2: 0.91, S3: 0.79, S4: 0.08, S5: 0.81, S6: 0.88, S7: 0.62, S8: 0.58 }, key_insight: '5 signals firing simultaneously with high reliability. Credit reduced to 40%.', hypotheses: [{ name: 'Pre-Planned Chargeback Fraud', probability: 82, supporting: ['Refundable ratio +73pp from baseline', 'Velocity 4.8×', '4 names across 34 bookings'], against: ['No confirmed missed invoice yet'] }, { name: 'Genuine Financial Distress', probability: 18, supporting: ['Payment delay could indicate cash flow pressure'], against: ['Refundable ratio and name reuse inconsistent with distress'] }] },
            { day: 21, trust_score: 12, previous_score: 31, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'BLOCKED', autonomous: true, cewe_phase: 'PHASE 2 → PHASE 3 TRANSITION', headline: 'Invoice missed entirely. All 6 primary signals at 0.85+. Amplifier triggered. Credit frozen. Legal hold initiated. Exposure: ₹3,84,000.', active_signals: { S1: 0.94, S2: 0.97, S3: 0.88, S4: 0.08, S5: 0.94, S6: 0.92, S7: 0.71, S8: 0.86 }, key_insight: 'Static system: Day 21 — missed invoice → flag. RiskSense AI saw Phase 1 on Day 7 (14 days earlier).' },
            { day: 27, trust_score: 4, previous_score: 12, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'BLOCKED', autonomous: true, cewe_phase: 'PHASE 3 — CRYSTALLISATION', headline: 'Dispute filings beginning. Agency uncontactable. Recovery team engaged.', active_signals: { S1: 0.00, S2: 0.00, S3: 0.00, S4: 0.00, S5: 0.97, S6: 0.00, S7: 0.00, S8: 0.96 }, key_insight: 'S1-S3, S6 dropped to 0.00 — booking activity stopped. Phase 3 signature: fraud executed, fraudster gone silent.' },
            { day: 30, trust_score: 2, previous_score: 4, trajectory: 'COLLAPSED', confidence: 'HIGH', decision: 'BLOCKED', autonomous: true, cewe_phase: 'PHASE 3 — CONFIRMED FRAUD', headline: 'Chargeback confirmed. ₹4,87,000 in disputed transactions. Weight update: all elevated signals receive true positive marks.', active_signals: { S1: 0.00, S2: 0.00, S3: 0.00, S4: 0.00, S5: 0.99, S6: 0.00, S7: 0.00, S8: 0.99 }, key_insight: 'Day 7→Phase 1 detected. Day 14→RESTRICT. Day 21→BLOCK. Day 30→Confirmed. Every step predicted.' },
        ],
    },
];

export const INJECT_EVENTS = [
    { label: 'Booking velocity spike (3× normal)', value: 'velocity_spike' },
    { label: 'Refundable ratio surge (+60pp)', value: 'refundable_surge' },
    { label: 'Invoice payment missed', value: 'invoice_missed' },
    { label: 'Mass cancellation cascade (12 rooms, 4hrs)', value: 'cancel_cascade' },
    { label: 'Suspicious login (unknown device, 2AM)', value: 'suspicious_login' },
    { label: 'Settlement delay worsening trend', value: 'settlement_delay' },
    { label: 'All signals firing simultaneously', value: 'all_signals' },
];

export const EVENT_DESCRIPTIONS: Record<string, string> = {
    velocity_spike: 'Booking velocity has spiked to 3× the baseline rate in the last 2 hours. 14 bookings made in rapid succession — compared to normal average of 4-5 per day.',
    refundable_surge: 'Refundable booking ratio has surged from the agency baseline to 92% over the last 48 hours. All recent bookings are fully refundable with departure within 7 days.',
    invoice_missed: 'Invoice INV-2024-047 (₹94,000) was due yesterday and has not been paid. Agency contact has not responded to automated reminders. This is the first missed invoice.',
    cancel_cascade: 'Cancellation cascade detected: 12 hotel room bookings at the same property, all cancelled within 4.2 hours of booking. Guest names use only 3 distinct names across all bookings.',
    suspicious_login: 'Login from unrecognised device at 2:14 AM from Kolkata — agency is based in a different city and usually operates 9AM-7PM. New device fingerprint not seen before.',
    settlement_delay: 'Settlement delay trend worsening: Last 3 invoices averaged 8.4 days late (up from 1.2 days three months ago). Current invoice is 6 days past due.',
    all_signals: 'MULTI-SIGNAL ALERT: S1 (velocity 3.8×), S2 (refundable 91%), S3 (lead time <4 days), S5 (utilization 89%), S6 (3 names across 28 bookings), S8 (invoice 12 days late) — all firing simultaneously.',
};

export function getBandColor(band: string): string {
    switch (band) {
        case 'CLEAR': return '#4CAF82';
        case 'CAUTION': return '#4CAF82';
        case 'WARNING': return '#E8C23A';
        case 'RESTRICTED': return '#E8833A';
        case 'BLOCKED': return '#E05C5C';
        default: return '#5A7A8A';
    }
}

export function getScoreColor(score: number): string {
    if (score >= 76) return '#4CAF82';
    if (score >= 56) return '#4CAF82';
    if (score >= 36) return '#E8C23A';
    if (score >= 16) return '#E8833A';
    return '#E05C5C';
}

export function getSignalColor(value: number): string {
    if (value <= 0.3) return '#4CAF82';
    if (value <= 0.6) return '#E8C23A';
    if (value <= 0.8) return '#E8833A';
    return '#E05C5C';
}

export function interpolateScores(snapshots: { day: number; trust_score: number }[]): { day: number; score: number }[] {
    const result: { day: number; score: number }[] = [];
    for (let d = 1; d <= 30; d++) {
        const exact = snapshots.find(s => s.day === d);
        if (exact) { result.push({ day: d, score: exact.trust_score }); continue; }
        const before = [...snapshots].reverse().find(s => s.day < d);
        const after = snapshots.find(s => s.day > d);
        if (!before && after) { result.push({ day: d, score: after.trust_score }); continue; }
        if (before && !after) { result.push({ day: d, score: before.trust_score }); continue; }
        if (before && after) {
            const t = (d - before.day) / (after.day - before.day);
            const score = Math.round(before.trust_score + t * (after.trust_score - before.trust_score));
            result.push({ day: d, score });
        }
    }
    return result;
}

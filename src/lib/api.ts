export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface Agency {
    id: string;
    name: string;
    credit_limit: number;
    outstanding_balance: number;
    platform_tenure_days: number;
    cohort_group: string;
    destination_profile: string;
    current_trust_score: number;
    current_band: string;
    available_credit: number;
    credit_ladder_state: string;
    last_synced_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SignalScoreOut {
    agency_id: string;
    computed_at: string;
    s1_velocity: number;
    s2_refundable_ratio: number;
    s3_lead_time: number;
    s4_cancellation_cascade: number;
    s5_credit_utilization: number;
    s6_passenger_name_reuse: number;
    s7_destination_spike: number;
    s8_settlement_delay: number;
}

export interface DecisionOut {
    id: string;
    agency_id: string;
    trust_score: number;
    band: string;
    credit_action: string;
    top_signal_1: string;
    top_signal_2: string;
    top_signal_3: string;
    explanation: string;
    counterfactual_guidance: string;
    analyst_override: boolean;
    analyst_notes?: string;
    decided_at: string;
}

export interface BookingEventOut {
    id: string;
    agency_id: string;
    event_type: string;
    booking_ref: string;
    guest_name?: string;
    destination_city?: string;
    booking_value: number;
    is_refundable: boolean;
    checkin_date?: string;
    booking_date?: string;
    timestamp: string;
}

export interface AgencyActionOut {
    id: string;
    agency_id: string;
    action_type: string;
    category: string;
    metadata_json: string;
    risk_indicator: string | null;
    timestamp: string;
}

export interface AlertOut {
    id: string;
    agency_id: string;
    alert_type: string;
    severity: string;
    message: string;
    is_acknowledged: boolean;
    is_escalated: boolean;
    created_at: string;
}

export interface DashboardStats {
    total_agencies: number;
    at_risk_count: number;
    alerts_today: number;
    total_credit_exposure: number;
}

// ─── Bayesian / Investigation Types ───

export interface SignalDetail {
    id: string;
    name: string;
    fraud_type: string;
    value: number;
    direction: string;
    weight: number;
    prior_weight: number;
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'LOCKED';
    locked: boolean;
    lock_reason: string;
    reliability: number;
    tp: number;
    fp: number;
    tn: number;
    fn: number;
    contribution: number;
}

export interface WeightProfileOut {
    agency_id: string;
    total_observations: number;
    learning_rate: number;
    previous_trust_score: number | null;
    weights: Record<string, number>;
    reliabilities: Record<string, number>;
    prior_weights: Record<string, number>;
    counters: Record<string, { tp: number; fp: number; tn: number; fn: number }>;
}

export interface InvestigationSnapshot {
    agency_id: string;
    agency_name: string;
    tenure_days: number;
    cohort: string;
    learning_rate: number;
    total_observations: number;
    trusted_signals: string[];
    discounted_signals: string[];
    locked_signals: string[];
    signals: SignalDetail[];
    trust_score: number;
    previous_score: number | null;
    trajectory: string;
    risk: number;
    band: string;
    credit_action: string;
    contributions: Record<string, number>;
    amplifier_applied: boolean;
    tenure_adjustment: number;
    confidence: string;
    confidence_reason: string;
    can_act_autonomously: boolean;
    // Multi-signal combination fields
    signal_strength: string;
    elevated_count: number;
    elevated_signals: string[];
    fraud_hypothesis: string | null;
    fraud_hypotheses: Array<{
        hypothesis: string;
        matching_signals: string[];
        match_count: number;
        total_required: number;
    }>;
    combination_action: string;
    // Chargeback phase detection
    chargeback_phase?: {
        phase: number;
        phase_description: string;
        phase_timeframe: string;
        phase_response: string;
        conditions_met: string[];
        confidence: string;
    };
    // Three-level containment recommendation
    containment?: {
        level: string;
        level_number: number;
        reason: string;
        recommended_actions: string[];
        escalation_criteria: string;
        notification_text: string;
    };
}

// API Fetchers
export const api = {
    getAgencies: async (): Promise<Agency[]> => {
        const res = await fetch(`${API_BASE}/agencies`);
        if (!res.ok) throw new Error('Failed to fetch agencies');
        return res.json();
    },
    getAgencyDetails: async (id: string): Promise<Agency> => {
        const res = await fetch(`${API_BASE}/agencies/${id}`);
        if (!res.ok) throw new Error('Failed to fetch agency');
        return res.json();
    },
    getAgencySignals: async (id: string): Promise<SignalScoreOut> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/signals`);
        if (!res.ok) throw new Error('Failed to fetch signals');
        return res.json();
    },
    getAgencyDecisions: async (id: string): Promise<DecisionOut[]> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/decisions`);
        if (!res.ok) throw new Error('Failed to fetch decisions');
        return res.json();
    },
    getAgencyScoreHistory: async (id: string): Promise<{ date: string, score: number, event?: string }[]> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/score-history`);
        if (!res.ok) throw new Error('Failed to fetch agency score history');
        return res.json();
    },
    getAgencyEvents: async (id: string): Promise<BookingEventOut[]> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/events`);
        if (!res.ok) throw new Error('Failed to fetch agency events');
        return res.json();
    },
    getAgencyActions: async (id: string, limit: number = 100, category?: string): Promise<AgencyActionOut[]> => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (category) params.append('category', category);
        const res = await fetch(`${API_BASE}/agencies/${id}/actions?${params}`);
        if (!res.ok) throw new Error('Failed to fetch agency actions');
        return res.json();
    },
    simulateNextAction: async (agencyId: string): Promise<{ status: string, new_trust_score: number, new_band: string }> => {
        const res = await fetch(`${API_BASE}/agencies/simulate-next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agency_id: agencyId })
        });
        if (!res.ok) throw new Error('Failed to simulate next action');
        return res.json();
    },

    // Bayesian / Investigation
    getWeightProfile: async (id: string): Promise<WeightProfileOut> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/weight-profile`);
        if (!res.ok) throw new Error('Failed to fetch weight profile');
        return res.json();
    },
    getInvestigation: async (id: string): Promise<InvestigationSnapshot> => {
        const res = await fetch(`${API_BASE}/agencies/${id}/investigation`);
        if (!res.ok) throw new Error('Failed to fetch investigation');
        return res.json();
    },

    // Alerts
    getAlerts: async (severity?: string, acknowledged?: boolean): Promise<AlertOut[]> => {
        const params = new URLSearchParams();
        if (severity) params.append('severity', severity);
        if (acknowledged !== undefined) params.append('acknowledged', String(acknowledged));
        const res = await fetch(`${API_BASE}/alerts?${params}`);
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
    },
    acknowledgeAlert: async (id: string) => {
        await fetch(`${API_BASE}/alerts/${id}/acknowledge`, { method: 'POST' });
    },
    escalateAlert: async (id: string) => {
        await fetch(`${API_BASE}/alerts/${id}/escalate`, { method: 'POST' });
    },

    // Dashboard
    getDashboardStats: async (): Promise<DashboardStats> => {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
    },
    getDashboardDistribution: async (): Promise<{ band: string; count: number }[]> => {
        const res = await fetch(`${API_BASE}/dashboard/distribution`);
        if (!res.ok) throw new Error('Failed to fetch dashboard distribution');
        return res.json();
    },
    getDashboardTimeline: async (days: number = 30): Promise<{ date: string; avg_score: number }[]> => {
        const res = await fetch(`${API_BASE}/dashboard/timeline?days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch dashboard timeline');
        return res.json();
    },
    getDashboardHeatmap: async (): Promise<number[][]> => {
        const res = await fetch(`${API_BASE}/dashboard/heatmap`);
        if (!res.ok) throw new Error('Failed to fetch dashboard heatmap');
        return res.json();
    },
    getLiveEvents: async (): Promise<BookingEventOut[]> => {
        const res = await fetch(`${API_BASE}/dashboard/events/live`);
        if (!res.ok) throw new Error('Failed to fetch live events');
        return res.json();
    },

    // Analytics
    getAnalyticsFraudTypes: async () => (await fetch(`${API_BASE}/analytics/by-fraud-type`)).json(),
    getAnalyticsSignalStats: async () => (await fetch(`${API_BASE}/analytics/signal-stats`)).json(),
    getAnalyticsCohort: async () => (await fetch(`${API_BASE}/analytics/cohort`)).json(),
    getAnalyticsExposure: async () => (await fetch(`${API_BASE}/analytics/credit-exposure`)).json(),

    // TBO & Simulator
    runTboSimulation: async (agencyId: string, scenario: string) => {
        const res = await fetch(`${API_BASE}/tbo/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agency_id: agencyId, scenario })
        });
        if (!res.ok) throw new Error('Simulation failed');
        return res.json();
    },
    tboHealth: async () => (await fetch(`${API_BASE}/tbo/health`)).json(),
    adminRecompute: async () => (await fetch(`${API_BASE}/admin/trigger-recompute`, { method: 'POST' })).json(),
    getTBOFlightSearch: async () => {
        const res = await fetch(`${API_BASE}/tbo/flight-search`);
        if (!res.ok) throw new Error('Failed to fetch TBO flight search');
        return res.json();
    },
    resetDatabase: async () => {
        const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to reset database');
        return res.json();
    },

    // Audit Log
    getAuditLog: async (actionType?: string, severity?: string): Promise<any[]> => {
        const params = new URLSearchParams();
        if (actionType) params.append('action_type', actionType);
        if (severity) params.append('severity', severity);
        const res = await fetch(`${API_BASE}/audit-log?${params}`);
        if (!res.ok) throw new Error('Failed to fetch audit log');
        return res.json();
    },

    // Settlement Trend
    getSettlementTrend: async (): Promise<{ date: string; avgDelay: number }[]> => {
        const res = await fetch(`${API_BASE}/analytics/settlement-trend`);
        if (!res.ok) throw new Error('Failed to fetch settlement trend');
        return res.json();
    },

    // KPI Sparklines
    getKpiSparklines: async (): Promise<{ agencies: number[]; warnings: number[]; alerts: number[]; exposure: number[] }> => {
        const res = await fetch(`${API_BASE}/dashboard/kpi-sparklines`);
        if (!res.ok) throw new Error('Failed to fetch KPI sparklines');
        return res.json();
    },

    // System Health
    getSystemHealth: async (): Promise<{
        api_status: string;
        latency_ms: number;
        last_sync: string | null;
        last_sync_label: string;
        events_last_cycle: number;
        events_24h: number;
    }> => {
        const res = await fetch(`${API_BASE}/admin/health`);
        if (!res.ok) throw new Error('Failed to fetch system health');
        return res.json();
    },
};

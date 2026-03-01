import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Agency, AlertOut, BookingEventOut } from '@/lib/api';

export interface UIEvent {
    id: string;
    agencyName: string;
    type: string;
    severity: "critical" | "warning" | "info";
    icon: string;
    timestamp: string;
}

export interface UISignal {
    id: string;
    name: string;
    score: number;
    status: "CRITICAL" | "ELEVATED" | "NORMAL" | "LOCKED";
    fraudType: string;
    description: string;
}

export interface UIAgency {
    id: string;
    name: string;
    trustScore: number;
    band: "CLEAR" | "CAUTION" | "WARNING" | "RESTRICTED" | "BLOCKED";
    creditLimit: number;
    outstandingBalance: number;
    utilization: number;
    tenure: number;
    cohort: string;
    chargebackPhase: number;
    credit_ladder_state: string;
    topSignal: string;
    signals: UISignal[];
    lastUpdated: string;
}

export interface UIAlert {
    id: string;
    agencyId: string;
    agencyName: string;
    type: string;
    severity: "critical" | "warning" | "info";
    description: string;
    timestamp: string;
    acknowledged: boolean;
    escalated: boolean;
}

interface DataContextType {
    agencies: UIAgency[];
    alerts: UIAlert[];
    dashboardStats: any | null;
    liveEvents: UIEvent[];
    heatmapData: number[][];
    timelineData: { date: string; avg_score: number }[];
    isLoading: boolean;
    refetch: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: rawAgencies = [], isLoading: loadingAgencies, refetch: refetchAgencies } = useQuery({
        queryKey: ['agencies'],
        queryFn: api.getAgencies,
        refetchInterval: 4000
    });

    const { data: rawAlerts = [], isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery({
        queryKey: ['alerts'],
        queryFn: () => api.getAlerts(),
        refetchInterval: 4000
    });

    const { data: rawEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
        queryKey: ['liveEvents'],
        queryFn: api.getLiveEvents,
        refetchInterval: 4000
    });

    const { data: rawFlightData = null, isLoading: loadingFlight, refetch: refetchFlight } = useQuery({
        queryKey: ['liveFlightData'],
        queryFn: api.getTBOFlightSearch
    });

    const { data: heatmapData = Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => 0)), isLoading: loadingHeatmap, refetch: refetchHeatmap } = useQuery({
        queryKey: ['heatmap'],
        queryFn: api.getDashboardHeatmap,
        refetchInterval: 10000,
    });

    const { data: timelineData = [], isLoading: loadingTimeline, refetch: refetchTimeline } = useQuery({
        queryKey: ['timeline'],
        queryFn: () => api.getDashboardTimeline(30),
        refetchInterval: 15000,
    });

    const { data: dashboardStats = null, isLoading: loadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: api.getDashboardStats,
        refetchInterval: 4000
    });

    const isLoading = loadingAgencies || loadingAlerts || loadingEvents || loadingHeatmap || loadingTimeline || loadingFlight || loadingStats;

    const refetch = () => {
        refetchAgencies();
        refetchAlerts();
        refetchEvents();
        refetchHeatmap();
        refetchTimeline();
        refetchStats();
        if (refetchFlight) refetchFlight();
    };

    const agencies = React.useMemo<UIAgency[]>(() => {
        // Start with the base agencies from the database
        const baseAgencies = rawAgencies.map((a: Agency) => ({
            id: a.id,
            name: a.name,
            trustScore: Math.round(a.current_trust_score),
            band: a.current_band as any,
            creditLimit: a.credit_limit,
            outstandingBalance: a.outstanding_balance,
            utilization: Math.round((a.outstanding_balance / (a.credit_limit || 1)) * 100) || 0,
            tenure: a.platform_tenure_days,
            cohort: a.cohort_group,
            chargebackPhase: 1, // Defaults to 1 for UI binding
            credit_ladder_state: a.credit_ladder_state,
            topSignal: 'Monitoring...',
            signals: [],
            lastUpdated: a.updated_at ? new Date(a.updated_at + 'Z').toLocaleString() : new Date().toLocaleString()
        }));

        // Option 2: Override DB mock agencies with LIVE TBO FLIGHT SEARCH results
        // We no longer arbitrarily inject live TBO searches into the first agency's balance 
        // to maintain the True Zero dashboard startup state. Simulator takes full control.

        return baseAgencies;
    }, [rawAgencies]);

    const alerts = React.useMemo<UIAlert[]>(() => rawAlerts.map((a: AlertOut) => ({
        id: a.id,
        agencyId: a.agency_id,
        agencyName: agencies.find(ag => ag.id === a.agency_id)?.name || 'Unknown',
        type: a.alert_type,
        severity: a.severity.toLowerCase() as any,
        description: a.message,
        timestamp: new Date(a.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        acknowledged: a.is_acknowledged,
        escalated: a.is_escalated,
    })), [rawAlerts, agencies]);

    const liveEvents = React.useMemo<UIEvent[]>(() => {
        const getSeverity = (eventType: string): 'critical' | 'warning' | 'info' => {
            if (['velocity_spike', 'cancellation_cascade', 'refund_abuse', 'destination_spike'].includes(eventType)) return 'warning';
            if (['settlement_miss', 'credit_max', 'name_reuse'].includes(eventType)) return 'critical';
            return 'info';
        };
        const getIcon = (eventType: string): string => {
            if (eventType.includes('cancel')) return 'x-circle';
            if (eventType.includes('flight') || eventType.includes('search')) return 'plane';
            if (eventType.includes('payment') || eventType.includes('invoice')) return 'file-text';
            if (eventType.includes('settlement')) return 'clock';
            if (eventType.includes('velocity') || eventType.includes('spike')) return 'zap';
            return 'activity';
        };
        return rawEvents.map((e: BookingEventOut) => ({
            id: e.id,
            agencyName: agencies.find(ag => ag.id === e.agency_id)?.name || 'Unknown',
            type: e.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            severity: getSeverity(e.event_type),
            icon: getIcon(e.event_type),
            timestamp: new Date(e.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
    }, [rawEvents, agencies]);

    return (
        <DataContext.Provider value={{
            agencies,
            alerts,
            dashboardStats,
            liveEvents,
            heatmapData,
            timelineData,
            isLoading,
            refetch
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
};

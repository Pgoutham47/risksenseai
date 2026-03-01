export type Band = 'CLEAR' | 'CAUTION' | 'WARNING' | 'RESTRICTED' | 'BLOCKED';
export type SignalStatus = 'NORMAL' | 'ELEVATED' | 'CRITICAL';
export type FraudType = 'Account Takeover' | 'Chargeback Abuse' | 'Credit Default' | 'Inventory Blocking';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type ChargebackPhase = 1 | 2 | 3;

export const SIGNAL_DEFINITIONS = [
    { id: 'S1', name: 'Booking Velocity', fraudType: 'Account Takeover' as FraudType },
    { id: 'S2', name: 'Refundable Ratio', fraudType: 'Chargeback Abuse' as FraudType },
    { id: 'S3', name: 'Cancellation Rate', fraudType: 'Chargeback Abuse' as FraudType },
    { id: 'S4', name: 'Credit Utilization', fraudType: 'Credit Default' as FraudType },
    { id: 'S5', name: 'Invoice Settlement Delay', fraudType: 'Credit Default' as FraudType },
    { id: 'S6', name: 'Destination Anomaly', fraudType: 'Account Takeover' as FraudType },
    { id: 'S7', name: 'PAX Name Diversity', fraudType: 'Inventory Blocking' as FraudType },
    { id: 'S8', name: 'Weekend/Holiday Surge', fraudType: 'Inventory Blocking' as FraudType },
];

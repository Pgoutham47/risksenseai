export type Band = 'CLEAR' | 'CAUTION' | 'WARNING' | 'RESTRICTED' | 'BLOCKED';
export type SignalStatus = 'NORMAL' | 'ELEVATED' | 'CRITICAL';
export type FraudType = 'Account Takeover' | 'Chargeback Abuse' | 'Credit Default' | 'Inventory Blocking';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type ChargebackPhase = 1 | 2 | 3;

export interface Signal {
  id: string;
  name: string;
  score: number;
  fraudType: FraudType;
  status: SignalStatus;
  description: string;
}

export interface Agency {
  id: string;
  name: string;
  trustScore: number;
  band: Band;
  signals: Signal[];
  creditLimit: number;
  outstandingBalance: number;
  utilization: number;
  tenure: number; // days
  cohort: string;
  lastUpdated: string;
  topSignal: string;
  chargebackPhase: ChargebackPhase;
}

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  agencyId: string;
  agencyName: string;
  type: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  escalated: boolean;
}

export interface EventItem {
  id: string;
  agencyName: string;
  type: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  icon: string;
}

export interface DecisionRecord {
  timestamp: string;
  trustScore: number;
  band: Band;
  topSignals: string[];
  action: string;
}

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

function makeSignals(overrides: Record<string, number>): Signal[] {
  return SIGNAL_DEFINITIONS.map(def => {
    const score = overrides[def.id] ?? Math.round(Math.random() * 20) / 100;
    const status: SignalStatus = score >= 0.7 ? 'CRITICAL' : score >= 0.4 ? 'ELEVATED' : 'NORMAL';
    const descriptions: Record<string, string> = {
      S1: score > 0.5 ? 'Unusual spike in booking frequency detected' : 'Booking velocity within normal range',
      S2: score > 0.5 ? 'High proportion of refundable bookings flagged' : 'Refundable ratio is healthy',
      S3: score > 0.5 ? 'Elevated cancellation pattern detected' : 'Cancellation rate is normal',
      S4: score > 0.5 ? 'Credit utilization approaching limit' : 'Credit usage is within bounds',
      S5: score > 0.5 ? 'Invoices settling slower than peer average' : 'Settlement timing is on track',
      S6: score > 0.5 ? 'Unusual destination pattern vs historical' : 'Destination mix is consistent',
      S7: score > 0.5 ? 'High diversity in passenger names flagged' : 'Passenger patterns are normal',
      S8: score > 0.5 ? 'Abnormal weekend/holiday booking surge' : 'Weekend patterns are typical',
    };
    return { id: def.id, name: def.name, score, fraudType: def.fraudType, status, description: descriptions[def.id] || '' };
  });
}

export const agencies: Agency[] = [
  { id: 'AGN-001', name: 'SkyTravel Pvt Ltd', trustScore: 12, band: 'BLOCKED', signals: makeSignals({ S1: 0.95, S2: 0.92, S3: 0.78, S4: 0.65 }), creditLimit: 1000000, outstandingBalance: 840000, utilization: 84, tenure: 420, cohort: 'Large International', lastUpdated: '2024-01-15 14:32', topSignal: 'S1 — Booking Velocity', chargebackPhase: 3 },
  { id: 'AGN-002', name: 'BharatRoutes Agency', trustScore: 31, band: 'RESTRICTED', signals: makeSignals({ S5: 0.78, S8: 0.71, S2: 0.45 }), creditLimit: 500000, outstandingBalance: 320000, utilization: 64, tenure: 180, cohort: 'Medium Mixed', lastUpdated: '2024-01-15 14:28', topSignal: 'S5 — Invoice Settlement', chargebackPhase: 2 },
  { id: 'AGN-003', name: 'Horizon Tours', trustScore: 48, band: 'WARNING', signals: makeSignals({ S2: 0.64, S3: 0.58, S7: 0.42 }), creditLimit: 300000, outstandingBalance: 190000, utilization: 63, tenure: 310, cohort: 'Small Domestic', lastUpdated: '2024-01-15 14:25', topSignal: 'S2 — Refundable Ratio', chargebackPhase: 1 },
  { id: 'AGN-004', name: 'FastTrack Holidays', trustScore: 67, band: 'CAUTION', signals: makeSignals({ S4: 0.44, S1: 0.30 }), creditLimit: 200000, outstandingBalance: 95000, utilization: 47, tenure: 540, cohort: 'Small Domestic', lastUpdated: '2024-01-15 14:20', topSignal: 'S4 — Credit Utilization', chargebackPhase: 1 },
  { id: 'AGN-005', name: 'PearlVoyages Ltd', trustScore: 82, band: 'CLEAR', signals: makeSignals({ S1: 0.08, S2: 0.12, S3: 0.05 }), creditLimit: 150000, outstandingBalance: 60000, utilization: 40, tenure: 720, cohort: 'Medium Mixed', lastUpdated: '2024-01-15 14:18', topSignal: 'None', chargebackPhase: 1 },
  { id: 'AGN-006', name: 'AlphaJet Travel', trustScore: 29, band: 'RESTRICTED', signals: makeSignals({ S1: 0.88, S6: 0.74, S3: 0.55 }), creditLimit: 600000, outstandingBalance: 410000, utilization: 68, tenure: 95, cohort: 'Large International', lastUpdated: '2024-01-15 14:15', topSignal: 'S1 — Booking Velocity', chargebackPhase: 2 },
  { id: 'AGN-007', name: 'TravelMate India', trustScore: 55, band: 'WARNING', signals: makeSignals({ S7: 0.71, S2: 0.60, S4: 0.38 }), creditLimit: 350000, outstandingBalance: 230000, utilization: 66, tenure: 250, cohort: 'Medium Mixed', lastUpdated: '2024-01-15 14:10', topSignal: 'S7 — PAX Name Diversity', chargebackPhase: 1 },
  { id: 'AGN-008', name: 'GlobalHop Agency', trustScore: 91, band: 'CLEAR', signals: makeSignals({ S1: 0.05, S2: 0.08, S3: 0.03 }), creditLimit: 120000, outstandingBalance: 45000, utilization: 37, tenure: 890, cohort: 'Small Domestic', lastUpdated: '2024-01-15 14:05', topSignal: 'None', chargebackPhase: 1 },
  { id: 'AGN-009', name: 'Zenith Travels', trustScore: 74, band: 'CAUTION', signals: makeSignals({ S3: 0.38, S5: 0.32 }), creditLimit: 250000, outstandingBalance: 110000, utilization: 44, tenure: 380, cohort: 'Medium Mixed', lastUpdated: '2024-01-15 13:58', topSignal: 'S3 — Cancellation Rate', chargebackPhase: 1 },
  { id: 'AGN-010', name: 'OceanWings Corp', trustScore: 44, band: 'WARNING', signals: makeSignals({ S1: 0.56, S8: 0.62, S4: 0.48 }), creditLimit: 400000, outstandingBalance: 280000, utilization: 70, tenure: 160, cohort: 'Large International', lastUpdated: '2024-01-15 13:50', topSignal: 'S8 — Weekend Surge', chargebackPhase: 1 },
  { id: 'AGN-011', name: 'NomadX Solutions', trustScore: 22, band: 'RESTRICTED', signals: makeSignals({ S2: 0.82, S5: 0.75, S1: 0.61 }), creditLimit: 450000, outstandingBalance: 380000, utilization: 84, tenure: 70, cohort: 'Medium Mixed', lastUpdated: '2024-01-15 13:45', topSignal: 'S2 — Refundable Ratio', chargebackPhase: 2 },
  { id: 'AGN-012', name: 'VistaPeak Holidays', trustScore: 86, band: 'CLEAR', signals: makeSignals({ S1: 0.06, S4: 0.11 }), creditLimit: 180000, outstandingBalance: 35000, utilization: 19, tenure: 650, cohort: 'Small Domestic', lastUpdated: '2024-01-15 13:40', topSignal: 'None', chargebackPhase: 1 },
];

export const liveEvents: EventItem[] = [
  { id: 'e1', agencyName: 'SkyTravel Pvt Ltd', type: 'Velocity spike detected', timestamp: '14:32:05', severity: 'critical', icon: 'zap' },
  { id: 'e2', agencyName: 'AlphaJet Travel', type: 'Booking made — BLR→DXB', timestamp: '14:31:42', severity: 'info', icon: 'plane' },
  { id: 'e3', agencyName: 'Horizon Tours', type: 'Cancellation flagged', timestamp: '14:30:18', severity: 'warning', icon: 'x-circle' },
  { id: 'e4', agencyName: 'BharatRoutes Agency', type: 'Invoice 72h overdue', timestamp: '14:29:55', severity: 'critical', icon: 'clock' },
  { id: 'e5', agencyName: 'TravelMate India', type: 'Score drop alert −8pts', timestamp: '14:28:33', severity: 'warning', icon: 'trending-down' },
  { id: 'e6', agencyName: 'FastTrack Holidays', type: 'Booking made — DEL→BOM', timestamp: '14:27:10', severity: 'info', icon: 'plane' },
  { id: 'e7', agencyName: 'NomadX Solutions', type: 'Credit limit review triggered', timestamp: '14:26:44', severity: 'critical', icon: 'alert-triangle' },
  { id: 'e8', agencyName: 'GlobalHop Agency', type: 'Monthly report generated', timestamp: '14:25:02', severity: 'info', icon: 'file-text' },
  { id: 'e9', agencyName: 'OceanWings Corp', type: 'Weekend surge pattern detected', timestamp: '14:24:18', severity: 'warning', icon: 'activity' },
  { id: 'e10', agencyName: 'SkyTravel Pvt Ltd', type: 'Chargeback Phase 3 entered', timestamp: '14:23:01', severity: 'critical', icon: 'shield-alert' },
  { id: 'e11', agencyName: 'PearlVoyages Ltd', type: 'Booking made — BOM→SIN', timestamp: '14:22:30', severity: 'info', icon: 'plane' },
  { id: 'e12', agencyName: 'Zenith Travels', type: 'Cancellation rate normalized', timestamp: '14:21:15', severity: 'info', icon: 'check-circle' },
];

export const alerts: AlertItem[] = [
  { id: 'a1', severity: 'CRITICAL', agencyId: 'AGN-001', agencyName: 'SkyTravel Pvt Ltd', type: 'Score Drop >20pts', description: "SkyTravel's Trust Score dropped from 34 to 12 in the last cycle, driven by a velocity spike (S1: 0.95) and refundable ratio surge (S2: 0.92).", timestamp: '2024-01-15 14:32', acknowledged: false, escalated: false },
  { id: 'a2', severity: 'CRITICAL', agencyId: 'AGN-006', agencyName: 'AlphaJet Travel', type: 'Chargeback Phase 2', description: "AlphaJet Travel has entered Chargeback Phase 2 — escalation pattern detected with sustained high booking velocity (S1: 0.88) and unusual destinations (S6: 0.74).", timestamp: '2024-01-15 14:15', acknowledged: false, escalated: false },
  { id: 'a3', severity: 'WARNING', agencyId: 'AGN-002', agencyName: 'BharatRoutes Agency', type: 'Invoice Late >72h', description: "BharatRoutes has 3 invoices overdue by more than 72 hours totaling ₹1,45,000. Settlement delay score (S5) has risen to 0.78.", timestamp: '2024-01-15 14:28', acknowledged: false, escalated: false },
  { id: 'a4', severity: 'CRITICAL', agencyId: 'AGN-011', agencyName: 'NomadX Solutions', type: 'Credit Frozen', description: "NomadX Solutions credit has been automatically frozen. Trust Score at 22, utilization at 84%, with refundable ratio (S2: 0.82) at critical levels.", timestamp: '2024-01-15 13:45', acknowledged: true, escalated: true },
  { id: 'a5', severity: 'WARNING', agencyId: 'AGN-007', agencyName: 'TravelMate India', type: 'Velocity Spike', description: "TravelMate India showed an unusual booking velocity spike in the last 4 hours. PAX name diversity (S7: 0.71) suggests potential inventory blocking behavior.", timestamp: '2024-01-15 14:10', acknowledged: false, escalated: false },
  { id: 'a6', severity: 'INFO', agencyId: 'AGN-009', agencyName: 'Zenith Travels', type: 'Score Recovery', description: "Zenith Travels Trust Score has recovered from 58 to 74 over the past 14 days. All signal scores are trending downward. Consider upgrading band to CLEAR.", timestamp: '2024-01-15 13:58', acknowledged: true, escalated: false },
  { id: 'a7', severity: 'WARNING', agencyId: 'AGN-010', agencyName: 'OceanWings Corp', type: 'Weekend Surge', description: "OceanWings Corp weekend booking volumes are 340% above weekday average. Signal S8 at 0.62. Pattern consistent with inventory blocking.", timestamp: '2024-01-15 13:50', acknowledged: false, escalated: false },
  { id: 'a8', severity: 'CRITICAL', agencyId: 'AGN-001', agencyName: 'SkyTravel Pvt Ltd', type: 'Legal Hold Initiated', description: "Legal hold has been initiated for SkyTravel Pvt Ltd following Chargeback Phase 3 crystallisation. Outstanding exposure: ₹8,40,000.", timestamp: '2024-01-15 14:35', acknowledged: false, escalated: true },
];

// Generate 30 days of score history
export function generateScoreHistory(days = 30): { date: string; avgScore: number; event?: string }[] {
  const data: { date: string; avgScore: number; event?: string }[] = [];
  let score = 58;
  const events: Record<number, string> = { 5: 'Fraud detected', 12: 'Policy update', 18: 'Credit frozen', 24: 'Bulk review' };
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    score += (Math.random() - 0.52) * 4;
    score = Math.max(35, Math.min(75, score));
    data.push({ date: d.toISOString().slice(5, 10), avgScore: Math.round(score * 10) / 10, event: events[days - i] });
  }
  return data;
}

export function generateAgencyScoreHistory(baseScore: number, days = 90): { date: string; score: number; event?: string }[] {
  const data: { date: string; score: number; event?: string }[] = [];
  let score = baseScore + 20;
  const events: Record<number, string> = { 10: 'Mass cancellation', 25: 'Invoice late', 40: 'Velocity spike', 60: 'Review completed', 75: 'Credit adjusted' };
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    score += (Math.random() - 0.48) * 3;
    score = Math.max(5, Math.min(95, score));
    data.push({ date: d.toISOString().slice(5, 10), score: Math.round(score * 10) / 10, event: events[days - i] });
  }
  // Make final score close to baseScore
  if (data.length > 0) data[data.length - 1].score = baseScore;
  return data;
}

// Signal heatmap data: 8 signals × 7 days
export function generateHeatmapData(): number[][] {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 6))
  );
}

export const decisionHistory: Record<string, DecisionRecord[]> = {
  'AGN-001': [
    { timestamp: '2024-01-15 14:32', trustScore: 12, band: 'BLOCKED', topSignals: ['S1', 'S2', 'S3'], action: 'Auto-blocked — Credit frozen' },
    { timestamp: '2024-01-14 10:15', trustScore: 24, band: 'RESTRICTED', topSignals: ['S1', 'S2'], action: 'Credit limit reduced 50%' },
    { timestamp: '2024-01-12 08:45', trustScore: 34, band: 'RESTRICTED', topSignals: ['S1'], action: 'Moved to RESTRICTED' },
    { timestamp: '2024-01-10 16:20', trustScore: 45, band: 'WARNING', topSignals: ['S1', 'S4'], action: 'Enhanced monitoring enabled' },
    { timestamp: '2024-01-08 09:00', trustScore: 52, band: 'WARNING', topSignals: ['S4'], action: 'Warning notice sent' },
  ],
};

export function getBandClass(band: Band): string {
  return `band-${band.toLowerCase()}`;
}

export function getBorderBandClass(band: Band): string {
  return `border-band-${band.toLowerCase()}`;
}

export function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export function getBandColor(band: Band): string {
  const colors: Record<Band, string> = {
    CLEAR: 'hsl(142, 70%, 42%)',
    CAUTION: 'hsl(45, 90%, 52%)',
    WARNING: 'hsl(30, 85%, 50%)',
    RESTRICTED: 'hsl(0, 65%, 55%)',
    BLOCKED: 'hsl(0, 70%, 35%)',
  };
  return colors[band];
}

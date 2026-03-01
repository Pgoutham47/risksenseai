# Required Real-Time API Endpoints

To completely populate the application using the components that have been stripped of mock data, the backend will need to supply the following structures via the DataContext API or specific new endpoints.

## 1. Global Core Data (`DataContext.tsx`)

Currently, the `DataContext` fetches:
- `GET /metrics/dashboard`
- `GET /metrics/alerts`
- `GET /events/live`

### A. Agency Objects (`UIAgency`)
The `/metrics/dashboard` or a dedicated `/agencies` endpoint must return a list of full agency objects that map to the `UIAgency` interface:

```typescript
interface UIAgency {
  id: string;
  name: string;
  trustScore: number;
  band: 'CLEAR' | 'CAUTION' | 'WARNING' | 'RESTRICTED' | 'BLOCKED';
  creditLimit: number;
  outstandingBalance: number;
  utilization: number;
  tenure: number;         // Platform tenure in days
  cohort: string;         // e.g., 'Small Domestic', 'Large International'
  chargebackPhase: number; // 1, 2, or 3
  topSignal: string;      // Description of the highest driving signal
  lastUpdated: string;    // ISO timestamp or formatted string
  signals: Array<{
    id: string; // e.g. 'S1', 'S2'
    name: string;
    score: number; // 0.0 to 1.0
    fraudType: string;
    status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
    description: string;
  }>;
}
```

### B. Alerts Array (`AlertItem`)
The `/metrics/alerts` endpoint must supply:
```typescript
interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  agencyId: string;
  agencyName: string;
  type: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  escalated: boolean;
}
```

### C. Live Events Feed (`EventItem`)
The `/events/live` endpoint must push real-time updates for:
```typescript
interface EventItem {
  id: string;
  agencyName: string;
  type: string;
  timestamp: string; // e.g., '14:32:05'
  severity: 'critical' | 'warning' | 'info';
  icon: 'zap' | 'plane' | 'x-circle' | 'clock' | 'trending-down' | 'alert-triangle' | 'file-text' | 'activity' | 'shield-alert' | 'check-circle';
}
```

---

## 2. Dynamic Charts & History Endpoints

Previously, these were generated purely via mathematical mock functions. New endpoints need to provide this time-series data:

### A. Agency Score History (`/agencies/{id}/history`)
Used in: `AgencyProfile.tsx`, `AgencyDirectory.tsx` (Sparklines), and `ReportBuilder.tsx`.
Returns the historical trend of a specific agency's Trust Score over a specified range of days (e.g., 30 or 90).
```typescript
[
  {
    date: string,   // e.g., '2024-01-01'
    score: number,  // Trust score on that day
    event?: string, // Optional: any major event that occurred that day
  }
]
```

### B. Global Score History (`/metrics/score-history?timeRange={range}`)
Used in: `Dashboard.tsx` (Main Area Chart spanning 24h, 7d, 30d).
Returns the global average risk score over the given timeframe.
```typescript
[
  {
    date: string,
    avgScore: number,
    event?: string,
  }
]
```

### C. Global Signal Heatmap (`/metrics/heatmap`)
Used in: `Dashboard.tsx` (Interactive Heatmap showing all 8 signal distributions across the past 7 days).
Returns an 8x7 matrix (or equivalent mapped structure) counting the intensity/volume of signals triggered over the last week.
```typescript
// Example JSON signature structure
{
  "matrix": number[][] // 8 rows (signals) x 7 columns (days)
}
```

### D. Agency Decision History Logs (`/agencies/{id}/decisions`)
Used in: `AgencyProfile.tsx` and `ReportBuilder.tsx`.
Returns the system/analyst actions enacted on an agency over time.
```typescript
[
  {
    timestamp: string,
    trustScore: number,
    band: string,
    topSignals: string[], // Array of signal IDs like ['S1', 'S4']
    action: string        // e.g., 'Auto-blocked — Credit frozen'
  }
]
```

### E. Audit Logs (`/metrics/audit`)
Used in: `AuditLog.tsx`
Returns the global risk-analyst actions taken across all components.
```typescript
[
  {
    id: string;
    timestamp: Date | string; // Ideally ISO standard format
    user: string;
    action: 'Override' | 'Acknowledge' | 'Escalation' | 'Band Change' | 'Credit Adjust' | 'Setting Change';
    agencyName?: string;
    agencyId?: string;
    description: string;
    details: string[];
    severity: 'high' | 'medium' | 'low';
  }
]
```

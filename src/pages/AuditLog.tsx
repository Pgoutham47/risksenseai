import React, { useState, useMemo } from 'react';
import { ClipboardList, Filter, Search, ChevronDown } from 'lucide-react';
import { PageTransition } from '@/components/AnimatedComponents';
import { agencies } from '@/data/mockData';

type ActionType = 'Override' | 'Acknowledge' | 'Escalation' | 'Band Change' | 'Credit Adjust' | 'Setting Change';
type AuditSeverity = 'high' | 'medium' | 'low';

interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: ActionType;
  agencyId: string;
  agencyName: string;
  detail: string;
  severity: AuditSeverity;
}

const ACTION_TYPES: ActionType[] = ['Override', 'Acknowledge', 'Escalation', 'Band Change', 'Credit Adjust', 'Setting Change'];

const USERS = ['Admin (Risk Officer)', 'Priya Sharma', 'Rajesh Gupta', 'Neha Verma'];

function generateAuditLog(): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const templates: { action: ActionType; details: string[]; severity: AuditSeverity }[] = [
    { action: 'Override', details: [
      'Overrode band from RESTRICTED to CAUTION — "Agency provided documentation for spike"',
      'Overrode band from WARNING to CLEAR — "Seasonal pattern confirmed by ops team"',
      'Overrode band from BLOCKED to RESTRICTED — "Legal hold lifted, partial credit restored"',
    ], severity: 'high' },
    { action: 'Acknowledge', details: [
      'Acknowledged CRITICAL alert — Score Drop >20pts',
      'Acknowledged WARNING alert — Invoice Late >72h',
      'Acknowledged CRITICAL alert — Credit Frozen',
      'Acknowledged WARNING alert — Velocity Spike',
      'Acknowledged INFO alert — Score Recovery',
    ], severity: 'low' },
    { action: 'Escalation', details: [
      'Escalated alert to senior risk team — Chargeback Phase 2 entered',
      'Escalated alert to legal — Legal Hold Initiated',
      'Escalated to compliance — Repeated override pattern detected',
    ], severity: 'high' },
    { action: 'Band Change', details: [
      'Auto band change: CAUTION → WARNING (score dropped below 56)',
      'Auto band change: WARNING → RESTRICTED (score dropped below 36)',
      'Auto band change: RESTRICTED → BLOCKED (score dropped below 16)',
      'Auto band change: RESTRICTED → WARNING (score recovered above 36)',
    ], severity: 'medium' },
    { action: 'Credit Adjust', details: [
      'Credit limit reduced to 75% — WARNING band policy applied',
      'Credit limit reduced to 40% — RESTRICTED band policy applied',
      'Credit frozen — BLOCKED band policy applied',
      'Credit restored to 100% — moved to CLEAR band',
    ], severity: 'medium' },
    { action: 'Setting Change', details: [
      'Updated Signal S1 weight from 18% to 22%',
      'Updated BLOCKED threshold from 15 to 12',
      'Changed escalation email to risk-escalation@tbo.com',
      'Disabled alert type: Score Recovery',
    ], severity: 'low' },
  ];

  for (let i = 0; i < 40; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const agency = agencies[Math.floor(Math.random() * agencies.length)];
    const detail = template.details[Math.floor(Math.random() * template.details.length)];
    const hoursAgo = Math.floor(Math.random() * 720); // up to 30 days
    entries.push({
      id: `audit-${i}`,
      timestamp: new Date(Date.now() - hoursAgo * 3600000),
      user: USERS[Math.floor(Math.random() * USERS.length)],
      action: template.action,
      agencyId: template.action === 'Setting Change' ? '—' : agency.id,
      agencyName: template.action === 'Setting Change' ? 'System' : agency.name,
      detail,
      severity: template.severity,
    });
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const auditLog = generateAuditLog();

const severityStyles: Record<AuditSeverity, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-band-warning/10 text-band-warning',
  low: 'bg-primary/10 text-primary',
};

const actionStyles: Record<ActionType, string> = {
  Override: 'bg-destructive/8 text-destructive border-destructive/20',
  Acknowledge: 'bg-band-clear/8 text-band-clear border-band-clear/20',
  Escalation: 'bg-band-warning/8 text-band-warning border-band-warning/20',
  'Band Change': 'bg-primary/8 text-primary border-primary/20',
  'Credit Adjust': 'bg-band-caution/8 text-band-caution border-band-caution/20',
  'Setting Change': 'bg-muted text-muted-foreground border-border',
};

function formatTimestamp(d: Date): string {
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const AuditLog: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType | 'All'>('All');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      if (actionFilter !== 'All' && e.action !== actionFilter) return false;
      if (severityFilter !== 'All' && e.severity !== severityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.agencyName.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.agencyId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, actionFilter, severityFilter]);

  const counts = useMemo(() => ({
    total: auditLog.length,
    overrides: auditLog.filter(e => e.action === 'Override').length,
    escalations: auditLog.filter(e => e.action === 'Escalation').length,
    high: auditLog.filter(e => e.severity === 'high').length,
  }), []);

  return (
    <PageTransition>
      <div className="space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg tracking-wider text-foreground">Audit Log</h2>
              <p className="text-xs text-muted-foreground">All analyst actions, system events & compliance trail</p>
            </div>
          </div>
        </div>

        {/* KPI counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: counts.total },
            { label: 'Overrides', value: counts.overrides },
            { label: 'Escalations', value: counts.escalations },
            { label: 'High Severity', value: counts.high, danger: true },
          ].map((k, i) => (
            <div key={i} className="kpi-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{k.label}</p>
              <p className={`font-mono text-xl font-bold ${k.danger ? 'text-destructive' : 'text-foreground'}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by agency, user, or action detail..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Action Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['All', ...ACTION_TYPES] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setActionFilter(type)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                        actionFilter === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Severity</label>
                <div className="flex gap-1.5">
                  {(['All', 'high', 'medium', 'low'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize ${
                        severityFilter === sev ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agency</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Detail</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">No matching audit entries found.</td>
                  </tr>
                ) : (
                  filtered.map(entry => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                      <td className="py-2.5 px-4 text-foreground font-medium whitespace-nowrap">{entry.user}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${actionStyles[entry.action]}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-foreground">{entry.agencyName}</span>
                        {entry.agencyId !== '—' && <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">{entry.agencyId}</span>}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate">{entry.detail}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${severityStyles[entry.severity]}`}>
                          {entry.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Showing {filtered.length} of {auditLog.length} entries</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AuditLog;

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, Eye, ArrowUpRight, CheckCircle } from 'lucide-react';
import { alerts, type AlertSeverity } from '@/data/mockData';
import { PageTransition } from '@/components/AnimatedComponents';

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
  CRITICAL: <AlertCircle className="w-5 h-5 text-destructive" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-primary" />,
  INFO: <Info className="w-5 h-5 text-severity-info" />,
};

const AlertsCenter: React.FC = () => {
  const navigate = useNavigate();
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [sevFilter, setSevFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [ackFilter, setAckFilter] = useState<'ALL' | 'UNACK' | 'ACK'>('ALL');

  const filtered = useMemo(() => {
    let list = [...localAlerts];
    if (sevFilter !== 'ALL') list = list.filter(a => a.severity === sevFilter);
    if (ackFilter === 'UNACK') list = list.filter(a => !a.acknowledged);
    if (ackFilter === 'ACK') list = list.filter(a => a.acknowledged);
    return list;
  }, [localAlerts, sevFilter, ackFilter]);

  const unack = localAlerts.filter(a => !a.acknowledged).length;
  const escalated = localAlerts.filter(a => a.escalated).length;
  const resolved = localAlerts.filter(a => a.acknowledged).length;

  const acknowledge = (id: string) => setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  const escalate = (id: string) => setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, escalated: true } : a));

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Summary Strip */}
        <div className="flex gap-4">
          {[
            { label: 'Unacknowledged', value: unack, color: 'text-destructive' },
            { label: 'Escalated', value: escalated, color: 'text-primary' },
            { label: 'Resolved Today', value: resolved, color: 'text-band-clear' },
          ].map(s => (
            <div key={s.label} className="kpi-card flex-1 flex items-center gap-3">
              <span className={`font-mono text-2xl ${s.color}`}>{s.value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value as any)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="ALL">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
          <select value={ackFilter} onChange={e => setAckFilter(e.target.value as any)} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="ALL">All Status</option>
            <option value="UNACK">Unacknowledged</option>
            <option value="ACK">Acknowledged</option>
          </select>
        </div>

        {/* Alert Cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="panel p-12 text-center">
              <CheckCircle className="w-10 h-10 text-band-clear mx-auto mb-3" />
              <p className="text-muted-foreground font-heading tracking-wider">All clear — no matching alerts</p>
            </div>
          )}
          {filtered.map(alert => (
            <div key={alert.id} className={`panel p-5 flex gap-4 transition-opacity ${alert.acknowledged ? 'opacity-60' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">{severityIcons[alert.severity]}</div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-sm tracking-wider text-foreground">{alert.agencyName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{alert.agencyId}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${alert.severity === 'CRITICAL' ? 'bg-destructive/15 text-destructive' : alert.severity === 'WARNING' ? 'bg-primary/15 text-primary' : 'bg-severity-info/15 text-severity-info'}`}>{alert.type}</span>
                  {alert.escalated && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">ESCALATED</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{alert.timestamp}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => navigate(`/agency/${alert.agencyId}`)} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <Eye className="w-3 h-3" /> View
                </button>
                {!alert.acknowledged && (
                  <button onClick={() => acknowledge(alert.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <CheckCircle className="w-3 h-3" /> Ack
                  </button>
                )}
                {!alert.escalated && (
                  <button onClick={() => escalate(alert.id)} className="flex items-center gap-1 text-[11px] text-destructive hover:underline">
                    <ArrowUpRight className="w-3 h-3" /> Escalate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default AlertsCenter;

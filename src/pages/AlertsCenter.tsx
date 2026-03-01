import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, Eye, ArrowUpRight, CheckCircle, Download } from 'lucide-react';
import { type AlertSeverity } from '@/lib/constants';
import { useData } from '@/contexts/DataContext';
import { api } from '@/lib/api';
import { PageTransition } from '@/components/AnimatedComponents';
import { toast } from '@/hooks/use-toast';

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
  CRITICAL: <AlertCircle className="w-5 h-5 text-destructive" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-band-warning" />,
  INFO: <Info className="w-5 h-5 text-severity-info" />,
};

const AlertsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { alerts } = useData();
  const [localAlerts, setLocalAlerts] = useState(alerts);

  React.useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);
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

  const acknowledge = (id: string) => {
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    const alert = localAlerts.find(a => a.id === id);
    toast({ title: 'Alert Acknowledged', description: `${alert?.type} for ${alert?.agencyName} has been acknowledged.` });
  };

  const escalate = (id: string) => {
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, escalated: true } : a));
    const alert = localAlerts.find(a => a.id === id);
    toast({ title: 'Alert Escalated', description: `${alert?.type} for ${alert?.agencyName} has been escalated to the senior risk team.`, variant: 'destructive' });
  };

  const acknowledgeAll = () => {
    const unackCount = localAlerts.filter(a => !a.acknowledged).length;
    setLocalAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    toast({ title: 'All Acknowledged', description: `${unackCount} alerts have been marked as acknowledged.` });
  };

  const exportAlerts = () => {
    const csv = [
      'ID,Severity,Agency,Type,Description,Timestamp,Acknowledged,Escalated',
      ...filtered.map(a => `${a.id},${a.severity},${a.agencyName},${a.type},"${a.description}",${a.timestamp},${a.acknowledged},${a.escalated}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risksense-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filtered.length} alerts exported to CSV.` });
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Summary Strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Unacknowledged', value: unack, color: 'text-destructive' },
            { label: 'Escalated', value: escalated, color: 'text-band-warning' },
            { label: 'Resolved Today', value: resolved, color: 'text-band-clear' },
          ].map(s => (
            <div key={s.label} className="kpi-card flex items-center gap-3">
              <span className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <select value={sevFilter} onChange={e => setSevFilter(e.target.value as any)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40">
              <option value="ALL">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
            <select value={ackFilter} onChange={e => setAckFilter(e.target.value as any)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40">
              <option value="ALL">All Status</option>
              <option value="UNACK">Unacknowledged</option>
              <option value="ACK">Acknowledged</option>
            </select>
          </div>
          <div className="flex gap-2">
            {unack > 0 && (
              <button onClick={acknowledgeAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Ack All ({unack})
              </button>
            )}
            <button onClick={exportAlerts} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
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
            <div key={alert.id} className={`panel p-5 flex gap-4 transition-all ${alert.acknowledged ? 'opacity-50' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">{severityIcons[alert.severity]}</div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-sm tracking-wider text-foreground">{alert.agencyName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{alert.agencyId}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${alert.severity === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : alert.severity === 'WARNING' ? 'bg-band-warning/10 text-band-warning' : 'bg-severity-info/10 text-severity-info'}`}>{alert.type}</span>
                  {alert.escalated && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/8 text-destructive">ESCALATED</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{alert.timestamp}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => navigate(`/agency/${alert.agencyId}`)} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline">
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

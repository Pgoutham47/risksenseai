import React from 'react';
import { Server, Globe, UserCheck, Activity, ArrowUpRight, Clock, Wifi } from 'lucide-react';
import { PageTransition } from '@/components/AnimatedComponents';

const sources = [
  {
    label: 'Staging API (SOAP)',
    description: 'Live booking data ingestion — search, booking, cancellation, pricing. Data is continuously ingested and normalized to analyze agency behavior, detect fraud patterns, and compute real-time trust and credit risk scores.',
    icon: <Server className="w-6 h-6" />,
    status: 'Connected',
    statusColor: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
    latency: '142ms',
    lastSync: '2 min ago',
    events: '3,842 today',
    uptime: '99.97%',
    details: ['Hotel search events', 'Booking confirmations', 'Cancellation records', 'Refundability flags', 'Guest & pricing data'],
  },
  {
    label: 'Web Portal',
    description: 'Manual verification layer for human analysts. Allows inspection of bookings, cancellations, account history, and anomalies flagged by the system. Ensures explainability, auditability, and human-in-the-loop oversight.',
    icon: <Globe className="w-6 h-6" />,
    status: 'Active',
    statusColor: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
    latency: '—',
    lastSync: 'Session active',
    events: '—',
    uptime: '—',
    details: ['Booking inspection', 'Cancellation review', 'Account history', 'Anomaly verification', 'Audit trail access'],
  },
  {
    label: 'Dummy Agency Account',
    description: 'Behavior simulation engine. Generates realistic booking, cancellation, and search behavior during testing and demos. Actions flow through TBO infrastructure and are captured by the staging API.',
    icon: <UserCheck className="w-6 h-6" />,
    status: 'Simulating',
    statusColor: 'text-amber-600',
    dotColor: 'bg-amber-500 animate-pulse',
    latency: '—',
    lastSync: '14 events today',
    events: '14 today',
    uptime: '—',
    details: ['Search simulation', 'Booking generation', 'Cancellation patterns', 'Live demo support', 'Fraud scenario replay'],
  },
];

const TBODataSources: React.FC = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Sources', value: '3', icon: <Wifi className="w-5 h-5 text-primary" /> },
            { label: 'Events Ingested (24h)', value: '3,856', icon: <Activity className="w-5 h-5 text-primary" /> },
            { label: 'Avg Latency', value: '142ms', icon: <Clock className="w-5 h-5 text-primary" /> },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card flex items-start justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">{kpi.label}</p>
                <p className="font-mono text-2xl text-foreground font-bold">{kpi.value}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary">{kpi.icon}</div>
            </div>
          ))}
        </div>

        {/* Source cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sources.map((source, i) => (
            <div key={i} className="panel p-6 flex flex-col">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">{source.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{source.label}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${source.statusColor}`}>
                    <span className={`w-2 h-2 rounded-full ${source.dotColor}`} />
                    {source.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-5">{source.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Latency', value: source.latency },
                  { label: 'Last Sync', value: source.lastSync },
                  { label: 'Events', value: source.events },
                  { label: 'Uptime', value: source.uptime },
                ].map((stat, j) => (
                  <div key={j} className="bg-secondary/50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xs font-mono font-semibold text-foreground mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Capabilities */}
              <div className="mt-auto">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {source.details.map((d, j) => (
                    <span key={j} className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground font-medium">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default TBODataSources;

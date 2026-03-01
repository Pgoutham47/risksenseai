import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { getBandColor, formatCurrency } from '@/lib/utils';
import { SIGNAL_DEFINITIONS, type Band } from '@/lib/constants';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { PageTransition } from '@/components/AnimatedComponents';
import { useData } from '@/contexts/DataContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const chartTickStyle = { fill: 'hsl(25, 15%, 50%)', fontSize: 10 };
const chartAxisStyle = { stroke: 'hsl(25, 15%, 85%)' };
const chartTooltipStyle = { background: 'hsl(30, 20%, 98%)', border: '1px solid hsl(25, 15%, 85%)', borderRadius: 8, fontSize: 11, color: 'hsl(25, 30%, 12%)', boxShadow: '0 4px 12px hsl(25 20% 20% / 0.08)' };

const Analytics: React.FC = () => {
  const { agencies } = useData();

  // Fetch all analytics data from API
  const { data: apiFraudTypes } = useQuery({
    queryKey: ['analyticsFraudTypes'],
    queryFn: api.getAnalyticsFraudTypes,
    refetchInterval: 15000,
  });

  const { data: apiSignalStats } = useQuery({
    queryKey: ['analyticsSignalStats'],
    queryFn: api.getAnalyticsSignalStats,
    refetchInterval: 15000,
  });

  const { data: apiCohort = [] } = useQuery({
    queryKey: ['analyticsCohort'],
    queryFn: api.getAnalyticsCohort,
    refetchInterval: 15000,
  });

  const { data: apiExposure = [] } = useQuery({
    queryKey: ['analyticsExposure'],
    queryFn: api.getAnalyticsExposure,
    refetchInterval: 15000,
  });

  const { data: settlementTrend = [] } = useQuery({
    queryKey: ['settlementTrend'],
    queryFn: api.getSettlementTrend,
    refetchInterval: 30000,
  });

  // Fraud type chart data from API
  const fraudTypeData = React.useMemo(() => {
    if (apiFraudTypes) {
      return Object.entries(apiFraudTypes).map(([type, count]) => ({
        type,
        count: count as number,
      }));
    }
    // Fallback: compute from agencies client-side
    const fraudTypes = ['Account Takeover', 'Chargeback Abuse', 'Credit Default', 'Inventory Blocking'];
    return fraudTypes.map(ft => ({
      type: ft,
      count: agencies.filter(a => a.signals.some((s: any) => s.fraudType === ft && s.score > 0.3)).length,
    }));
  }, [apiFraudTypes, agencies]);

  // Signal performance from API
  const signalPerformance = React.useMemo(() => {
    return SIGNAL_DEFINITIONS.map(def => {
      const statsFromApi = apiSignalStats?.[def.id];
      if (statsFromApi) {
        return {
          ...def,
          triggered: statsFromApi.triggers || 0,
          avgScore: statsFromApi.avg || 0,
          weight: Math.round((statsFromApi.avg || 0) * 100),
          trendUp: (statsFromApi.avg || 0) > 0.5,
        };
      }
      // Fallback: compute from agencies
      const triggered = agencies.filter(a => {
        const sig = a.signals.find((s: any) => s.id === def.id);
        return sig && sig.score > 0.3;
      });
      const avgScore = triggered.length > 0 ? triggered.reduce((sum, a) => sum + (a.signals.find((s: any) => s.id === def.id)?.score || 0), 0) / triggered.length : 0;
      return { ...def, triggered: triggered.length, avgScore: Math.round(avgScore * 100) / 100, weight: 0, trendUp: false };
    });
  }, [apiSignalStats, agencies]);

  // Cohort data from API
  const cohortData = React.useMemo(() => {
    if (apiCohort.length > 0) {
      return apiCohort.map((c: any) => {
        const group = agencies.filter(a => a.cohort === c.cohort);
        const bandDist = (['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => ({
          band: b,
          pct: group.length ? Math.round((group.filter(a => a.band === b).length / group.length) * 100) : 0,
        }));
        const topSignal = group.length > 0 ? (() => {
          const counts: Record<string, number> = {};
          group.forEach(a => a.signals.filter((s: any) => s.score > 0.3).forEach((s: any) => { counts[s.id] = (counts[s.id] || 0) + 1; }));
          return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
        })() : 'None';
        return { cohort: c.cohort, avgScore: Math.round(c.avg_score), topSignal, bandDist, count: group.length };
      });
    }
    // Fallback
    const cohorts = [...new Set(agencies.map(a => a.cohort))];
    return cohorts.map(c => {
      const group = agencies.filter(a => a.cohort === c);
      const avgScore = group.length ? Math.round(group.reduce((s, a) => s + a.trustScore, 0) / group.length) : 0;
      const bandDist = (['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => ({
        band: b,
        pct: group.length ? Math.round((group.filter(a => a.band === b).length / group.length) * 100) : 0,
      }));
      const topSignal = 'None';
      return { cohort: c, avgScore, topSignal, bandDist, count: group.length };
    });
  }, [apiCohort, agencies]);

  // Credit by band from API
  const creditByBand = React.useMemo(() => {
    const bands: Band[] = ['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'];
    if (apiExposure.length > 0) {
      return bands.map(b => {
        const found = apiExposure.find((e: any) => e.band === b);
        return { band: b, exposure: found?.exposure || 0, color: getBandColor(b) };
      });
    }
    return bands.map(b => ({
      band: b,
      exposure: agencies.filter(a => a.band === b).reduce((s, a) => s + a.outstandingBalance, 0),
      color: getBandColor(b),
    }));
  }, [apiExposure, agencies]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Fraud Type Breakdown */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Fraud Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fraudTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 90%)" horizontal={false} />
              <XAxis type="number" tick={chartTickStyle} axisLine={chartAxisStyle} />
              <YAxis type="category" dataKey="type" width={140} tick={chartTickStyle} axisLine={chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="hsl(38, 60%, 50%)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Performance */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Signal Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2.5 font-medium">Signal</th>
                  <th className="text-left py-2.5 font-medium">Name</th>
                  <th className="text-center py-2.5 font-medium"># Triggered</th>
                  <th className="text-center py-2.5 font-medium">Avg Score</th>
                  <th className="text-left py-2.5 font-medium">Fraud Type</th>
                  <th className="text-center py-2.5 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {signalPerformance.map(s => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2.5 font-mono text-foreground font-semibold">{s.id}</td>
                    <td className="py-2.5 text-foreground">{s.name}</td>
                    <td className="text-center font-mono text-foreground">{s.triggered}</td>
                    <td className="text-center font-mono text-foreground">{s.avgScore.toFixed(2)}</td>
                    <td className="py-2.5"><span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground text-[10px]">{s.fraudType}</span></td>
                    <td className="text-center">{s.trendUp ? <TrendingUp className="w-3.5 h-3.5 text-destructive inline" /> : <TrendingDown className="w-3.5 h-3.5 text-band-clear inline" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cohort Comparison */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Cohort Comparison</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohortData.map(c => (
              <div key={c.cohort} className="bg-secondary/40 rounded-xl p-5 space-y-3">
                <h4 className="font-heading text-xs tracking-wider text-foreground">{c.cohort}</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-mono text-foreground font-semibold">{c.avgScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Top Signal</span>
                  <span className="font-mono text-foreground font-semibold">{c.topSignal}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Agencies</span>
                  <span className="font-mono text-foreground font-semibold">{c.count}</span>
                </div>
                <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                  {c.bandDist.filter(b => b.pct > 0).map(b => (
                    <div key={b.band} style={{ width: `${b.pct}%`, background: getBandColor(b.band) }} title={`${b.band}: ${b.pct}%`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Exposure by Band */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Credit Exposure by Band</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={creditByBand}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 90%)" />
              <XAxis dataKey="band" tick={chartTickStyle} axisLine={chartAxisStyle} />
              <YAxis tickFormatter={v => formatCurrency(v)} tick={chartTickStyle} axisLine={chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="exposure" radius={[4, 4, 0, 0]} barSize={40}>
                {creditByBand.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Settlement Delay Trend */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Settlement Delay Trend — 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={settlementTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 90%)" />
              <XAxis dataKey="date" tick={chartTickStyle} axisLine={chartAxisStyle} />
              <YAxis tick={chartTickStyle} axisLine={chartAxisStyle} label={{ value: 'Avg Days', angle: -90, position: 'insideLeft', fill: 'hsl(25, 15%, 50%)', fontSize: 10 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="avgDelay" stroke="hsl(38, 60%, 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;

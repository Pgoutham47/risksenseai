import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { agencies, SIGNAL_DEFINITIONS, getBandColor, formatCurrency, type Band } from '@/data/mockData';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { PageTransition } from '@/components/AnimatedComponents';

// Fraud type breakdown
const fraudTypes = ['Account Takeover', 'Chargeback Abuse', 'Credit Default', 'Inventory Blocking'];
const fraudTypeData = fraudTypes.map(ft => ({
  type: ft,
  count: agencies.filter(a => a.signals.some(s => s.fraudType === ft && s.score > 0.3)).length,
}));

// Signal performance
const signalPerformance = SIGNAL_DEFINITIONS.map(def => {
  const triggered = agencies.filter(a => {
    const sig = a.signals.find(s => s.id === def.id);
    return sig && sig.score > 0.3;
  });
  const avgScore = triggered.length > 0 ? triggered.reduce((sum, a) => sum + (a.signals.find(s => s.id === def.id)?.score || 0), 0) / triggered.length : 0;
  return { ...def, triggered: triggered.length, avgScore: Math.round(avgScore * 100) / 100, weight: [18, 15, 12, 13, 14, 8, 10, 10][SIGNAL_DEFINITIONS.indexOf(def)], trendUp: Math.random() > 0.5 };
});

// Cohort comparison
const cohorts = ['Small Domestic', 'Medium Mixed', 'Large International'];
const cohortData = cohorts.map(c => {
  const group = agencies.filter(a => a.cohort === c);
  const avgScore = group.length ? Math.round(group.reduce((s, a) => s + a.trustScore, 0) / group.length) : 0;
  const bandDist = (['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => ({
    band: b,
    pct: group.length ? Math.round((group.filter(a => a.band === b).length / group.length) * 100) : 0,
  }));
  const topSignal = group.length > 0 ? (() => {
    const counts: Record<string, number> = {};
    group.forEach(a => a.signals.filter(s => s.score > 0.3).forEach(s => { counts[s.id] = (counts[s.id] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  })() : 'None';
  return { cohort: c, avgScore, topSignal, bandDist, count: group.length };
});

// Credit exposure by band
const bands: Band[] = ['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'];
const creditByBand = bands.map(b => ({
  band: b,
  exposure: agencies.filter(a => a.band === b).reduce((s, a) => s + a.outstandingBalance, 0),
  color: getBandColor(b),
}));

// Settlement delay trend (mock)
const settlementTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return { date: d.toISOString().slice(5, 10), avgDelay: Math.round((3 + Math.sin(i / 5) * 1.5 + Math.random()) * 10) / 10 };
});

const chartTooltipStyle = { background: 'hsl(220, 14%, 11%)', border: '1px solid hsl(220, 12%, 18%)', borderRadius: 6, fontSize: 11, color: 'hsl(210, 20%, 95%)' };

const Analytics: React.FC = () => {
  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Section 1 — Fraud Type Breakdown */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Fraud Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fraudTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 15%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} />
              <YAxis type="category" dataKey="type" width={140} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="hsl(38, 90%, 55%)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Section 2 — Signal Performance */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Signal Performance</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Signal</th>
                <th className="text-left py-2 font-medium">Name</th>
                <th className="text-center py-2 font-medium"># Triggered</th>
                <th className="text-center py-2 font-medium">Avg Score</th>
                <th className="text-left py-2 font-medium">Fraud Type</th>
                <th className="text-center py-2 font-medium">Weight %</th>
                <th className="text-center py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {signalPerformance.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2.5 font-mono text-foreground">{s.id}</td>
                  <td className="py-2.5 text-foreground">{s.name}</td>
                  <td className="text-center font-mono text-foreground">{s.triggered}</td>
                  <td className="text-center font-mono text-foreground">{s.avgScore.toFixed(2)}</td>
                  <td className="py-2.5"><span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground text-[10px]">{s.fraudType}</span></td>
                  <td className="text-center font-mono text-foreground">{s.weight}%</td>
                  <td className="text-center">{s.trendUp ? <TrendingUp className="w-3.5 h-3.5 text-destructive inline" /> : <TrendingDown className="w-3.5 h-3.5 text-band-clear inline" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3 — Cohort Comparison */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Cohort Comparison</h3>
          <div className="grid grid-cols-3 gap-4">
            {cohortData.map(c => (
              <div key={c.cohort} className="bg-secondary/40 rounded-lg p-4 space-y-3">
                <h4 className="font-heading text-xs tracking-wider text-foreground">{c.cohort}</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-mono text-foreground">{c.avgScore}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Top Signal</span>
                  <span className="font-mono text-foreground">{c.topSignal}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Agencies</span>
                  <span className="font-mono text-foreground">{c.count}</span>
                </div>
                <div className="flex gap-0.5 h-3 rounded overflow-hidden">
                  {c.bandDist.filter(b => b.pct > 0).map(b => (
                    <div key={b.band} style={{ width: `${b.pct}%`, background: getBandColor(b.band) }} title={`${b.band}: ${b.pct}%`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Credit Exposure by Band */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Credit Exposure by Band</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={creditByBand}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 15%)" />
              <XAxis dataKey="band" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} />
              <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="exposure" radius={[4, 4, 0, 0]} barSize={40}>
                {creditByBand.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Section 5 — Settlement Delay Trend */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Settlement Delay Trend — 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={settlementTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 15%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} />
              <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={{ stroke: 'hsl(220, 12%, 18%)' }} label={{ value: 'Avg Days', angle: -90, position: 'insideLeft', fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="avgDelay" stroke="hsl(38, 90%, 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;

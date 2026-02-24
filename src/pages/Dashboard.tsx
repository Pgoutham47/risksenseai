import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, LineChart, Line
} from 'recharts';
import {
  AlertTriangle, Activity, TrendingDown, TrendingUp, CreditCard,
  Zap, XCircle, Clock, Plane, FileText, ShieldAlert, CheckCircle,
  ArrowUpRight
} from 'lucide-react';
import {
  agencies, liveEvents, generateScoreHistory, generateHeatmapData,
  getBandClass, getBandColor, formatCurrency, type Band
} from '@/data/mockData';
import { AnimatedScore, PageTransition } from '@/components/AnimatedComponents';

// ── Data ───────────────────────────────────────────────────────────
const bandDistribution: { name: Band; value: number; color: string }[] = [
  { name: 'CLEAR', value: agencies.filter(a => a.band === 'CLEAR').length, color: getBandColor('CLEAR') },
  { name: 'CAUTION', value: agencies.filter(a => a.band === 'CAUTION').length, color: getBandColor('CAUTION') },
  { name: 'WARNING', value: agencies.filter(a => a.band === 'WARNING').length, color: getBandColor('WARNING') },
  { name: 'RESTRICTED', value: agencies.filter(a => a.band === 'RESTRICTED').length, color: getBandColor('RESTRICTED') },
  { name: 'BLOCKED', value: agencies.filter(a => a.band === 'BLOCKED').length, color: getBandColor('BLOCKED') },
];

const topAtRisk = [...agencies].sort((a, b) => a.trustScore - b.trustScore).slice(0, 5);
const heatmapData = generateHeatmapData();
const signals = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const iconMap: Record<string, React.ReactNode> = {
  'zap': <Zap className="w-3.5 h-3.5" />,
  'plane': <Plane className="w-3.5 h-3.5" />,
  'x-circle': <XCircle className="w-3.5 h-3.5" />,
  'clock': <Clock className="w-3.5 h-3.5" />,
  'trending-down': <TrendingDown className="w-3.5 h-3.5" />,
  'alert-triangle': <AlertTriangle className="w-3.5 h-3.5" />,
  'file-text': <FileText className="w-3.5 h-3.5" />,
  'activity': <Activity className="w-3.5 h-3.5" />,
  'shield-alert': <ShieldAlert className="w-3.5 h-3.5" />,
  'check-circle': <CheckCircle className="w-3.5 h-3.5" />,
};

const totalExposure = agencies.reduce((s, a) => s + a.outstandingBalance, 0);
const warningOrWorse = agencies.filter(a => ['WARNING', 'RESTRICTED', 'BLOCKED'].includes(a.band)).length;
const totalAgencies = agencies.length;

// ── Mini sparkline data generators ──────────────────────────────
function generateSparkline(base: number, len = 7, volatility = 0.15): number[] {
  const data: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v += (Math.random() - 0.5) * base * volatility;
    v = Math.max(0, v);
    data.push(Math.round(v));
  }
  return data;
}

const kpiSparklines = {
  agencies: generateSparkline(totalAgencies, 7, 0.05),
  warnings: generateSparkline(warningOrWorse, 7, 0.2),
  alerts: generateSparkline(8, 7, 0.4),
  exposure: generateSparkline(totalExposure / 100000, 7, 0.12),
};

// ── Sparkline component ────────────────────────────────────────
const MiniSparkline: React.FC<{ data: number[]; color: string; className?: string }> = ({ data, color, className = '' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className={`overflow-visible ${className}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// ── Custom chart tooltip ────────────────────────────────────────
const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono font-semibold text-foreground">{p.value.toFixed(1)}</p>
      ))}
    </div>
  );
};

// ── Time range type ─────────────────────────────────────────────
type TimeRange = '24h' | '7d' | '30d';
const timeRangeDays: Record<TimeRange, number> = { '24h': 1, '7d': 7, '30d': 30 };

// ── Dashboard ──────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const scoreHistory = useMemo(() => generateScoreHistory(timeRangeDays[timeRange]), [timeRange]);

  const kpis = [
    { label: 'Agencies Monitored', value: totalAgencies, icon: <Activity className="w-5 h-5" />, sparkData: kpiSparklines.agencies, sparkColor: 'hsl(var(--accent))' },
    { label: 'Warning or Worse', value: warningOrWorse, icon: <AlertTriangle className="w-5 h-5" />, danger: true, sparkData: kpiSparklines.warnings, sparkColor: 'hsl(var(--destructive))' },
    { label: 'Alerts (24h)', value: 8, icon: <Zap className="w-5 h-5" />, sparkData: kpiSparklines.alerts, sparkColor: 'hsl(var(--accent))' },
    { label: 'Credit Exposure', value: formatCurrency(totalExposure), icon: <CreditCard className="w-5 h-5" />, isString: true, sparkData: kpiSparklines.exposure, sparkColor: 'hsl(var(--accent))' },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ── KPI Bar with Sparklines ─────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div key={i} className="kpi-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</p>
                <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.08)' }}>
                  <span className={kpi.danger ? 'text-destructive' : 'text-accent'}>{kpi.icon}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  {kpi.isString ? (
                    <p className="font-mono text-2xl text-foreground font-bold">{kpi.value}</p>
                  ) : (
                    <p className={`font-mono text-2xl font-bold ${kpi.danger ? 'text-destructive' : 'text-foreground'}`}>
                      <AnimatedScore value={kpi.value as number} />
                    </p>
                  )}
                </div>
                <MiniSparkline data={kpi.sparkData} color={kpi.sparkColor} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Bento Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Risk Distribution — Donut with center stat */}
          <div className="lg:col-span-4 panel-glass p-6">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Risk Distribution</h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={bandDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                      {bandDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-3xl font-bold text-foreground">{totalAgencies}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-4 w-full">
                {bandDistribution.map(b => (
                  <div key={b.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                    <span className="text-xs text-muted-foreground">{b.name}</span>
                    <span className="font-mono text-xs text-foreground font-semibold ml-auto">{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 At-Risk — spans wider */}
          <div className="lg:col-span-8 panel-glass p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Top 5 At-Risk Agencies</h3>
              <button onClick={() => navigate('/agencies')} className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors font-medium uppercase tracking-wider">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2.5 font-medium">Agency</th>
                    <th className="text-center py-2.5 font-medium">Score</th>
                    <th className="text-center py-2.5 font-medium">Band</th>
                    <th className="text-right py-2.5 font-medium">Exposure</th>
                    <th className="text-right py-2.5 font-medium">Utilization</th>
                    <th className="text-center py-2.5 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topAtRisk.map(a => (
                    <tr key={a.id} className="border-b border-border/50 premium-row cursor-pointer" onClick={() => navigate(`/agency/${a.id}`)}>
                      <td className="py-3 text-foreground font-medium">{a.name}</td>
                      <td className="text-center font-mono text-foreground font-semibold">{a.trustScore}</td>
                      <td className="text-center"><span className={getBandClass(a.band)}>{a.band}</span></td>
                      <td className="text-right font-mono text-foreground">{formatCurrency(a.outstandingBalance)}</td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${a.utilization}%`,
                              background: a.utilization > 70 ? 'hsl(var(--destructive))' : a.utilization > 50 ? 'hsl(var(--band-warning))' : 'hsl(var(--band-clear))'
                            }} />
                          </div>
                          <span className="font-mono text-muted-foreground">{a.utilization}%</span>
                        </div>
                      </td>
                      <td className="text-center">{a.trustScore < 40 ? <TrendingDown className="w-3.5 h-3.5 text-destructive inline" /> : <TrendingUp className="w-3.5 h-3.5 text-band-clear inline" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Event Feed */}
          <div className="lg:col-span-5 panel-glass p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Live Event Feed</h3>
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-band-clear pulse-live" />
                LIVE
              </span>
            </div>
            <div className="space-y-0 max-h-[260px] overflow-y-auto pr-1">
              {liveEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/[0.03] transition-colors rounded-md px-1">
                  <span className={`severity-dot mt-1.5 ${ev.severity === 'critical' ? 'severity-critical' : ev.severity === 'warning' ? 'severity-warning' : 'severity-info'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{iconMap[ev.icon]}</span>
                      <span className="text-xs text-foreground font-medium truncate">{ev.agencyName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ev.type}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{ev.timestamp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Activity Heatmap */}
          <div className="lg:col-span-7 panel-glass p-6">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Signal Activity Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    {days.map(d => <th key={d} className="text-center text-muted-foreground font-normal py-1.5">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, si) => (
                    <tr key={s}>
                      <td className="font-mono text-muted-foreground text-[10px] py-1">{s}</td>
                      {days.map((dayName, di) => {
                        const val = heatmapData[si][di];
                        const opacity = Math.min(val / 5, 1);
                        return (
                          <td key={di} className="p-0.5">
                            <div
                              className="w-full h-7 rounded-md transition-colors duration-200 flex items-center justify-center cursor-default group relative"
                              style={{ background: `hsl(var(--chart-heatmap) / ${opacity * 0.55 + 0.04})` }}
                            >
                              <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-foreground/70">{val}</span>
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-2 py-1 text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                                {s} · {dayName}: {val} agencies
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Score Timeline with Area Chart + Time Range Selector ─ */}
        <div className="panel-glass p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Score Movement Timeline</h3>
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
              {(['24h', '7d', '30d'] as TimeRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wider transition-all ${
                    timeRange === r
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={scoreHistory}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--chart-axis))' }}
              />
              <YAxis
                domain={[30, 80]}
                tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--chart-axis))' }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="avgScore"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
              {scoreHistory.filter(d => d.event).map((d, i) => (
                <ReferenceLine
                  key={i}
                  x={d.date}
                  stroke="hsl(var(--destructive) / 0.5)"
                  strokeDasharray="4 4"
                  label={{ value: d.event, position: 'top', fill: 'hsl(var(--chart-tick))', fontSize: 9 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;

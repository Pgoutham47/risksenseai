import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { AlertTriangle, Activity, TrendingDown, TrendingUp, CreditCard, Zap, XCircle, Clock, Plane, FileText, ShieldAlert, CheckCircle } from 'lucide-react';
import { agencies, liveEvents, generateScoreHistory, generateHeatmapData, getBandClass, getBandColor, formatCurrency, type Band } from '@/data/mockData';
import { AnimatedScore, PageTransition } from '@/components/AnimatedComponents';

const bandDistribution: { name: Band; value: number; color: string }[] = [
  { name: 'CLEAR', value: agencies.filter(a => a.band === 'CLEAR').length, color: getBandColor('CLEAR') },
  { name: 'CAUTION', value: agencies.filter(a => a.band === 'CAUTION').length, color: getBandColor('CAUTION') },
  { name: 'WARNING', value: agencies.filter(a => a.band === 'WARNING').length, color: getBandColor('WARNING') },
  { name: 'RESTRICTED', value: agencies.filter(a => a.band === 'RESTRICTED').length, color: getBandColor('RESTRICTED') },
  { name: 'BLOCKED', value: agencies.filter(a => a.band === 'BLOCKED').length, color: getBandColor('BLOCKED') },
];

const topAtRisk = [...agencies].sort((a, b) => a.trustScore - b.trustScore).slice(0, 5);
const scoreHistory = generateScoreHistory();
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

const chartTickStyle = { fill: 'hsl(215, 16%, 47%)', fontSize: 10 };
const chartAxisStyle = { stroke: 'hsl(220, 13%, 89%)' };
const chartTooltipStyle = { background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 89%)', borderRadius: 8, fontSize: 12, color: 'hsl(222, 47%, 11%)', boxShadow: '0 4px 12px hsl(0 0% 0% / 0.08)' };

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Agencies Monitored', value: agencies.length, icon: <Activity className="w-5 h-5 text-primary" /> },
            { label: 'Warning or Worse', value: warningOrWorse, icon: <AlertTriangle className="w-5 h-5 text-destructive" />, danger: true },
            { label: 'Alerts (24h)', value: 8, icon: <Zap className="w-5 h-5 text-primary" /> },
            { label: 'Credit Exposure', value: formatCurrency(totalExposure), icon: <CreditCard className="w-5 h-5 text-primary" />, isString: true },
          ].map((kpi, i) => (
            <div key={i} className="kpi-card flex items-start justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">{kpi.label}</p>
                {kpi.isString ? (
                  <p className="font-mono text-2xl text-foreground font-bold">{kpi.value}</p>
                ) : (
                  <p className={`font-mono text-2xl font-bold ${kpi.danger ? 'text-destructive' : 'text-foreground'}`}>
                    <AnimatedScore value={kpi.value as number} />
                  </p>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-secondary">{kpi.icon}</div>
            </div>
          ))}
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Donut */}
            <div className="panel p-6">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Risk Distribution</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={bandDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {bandDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {bandDistribution.map(b => (
                    <div key={b.name} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded" style={{ background: b.color }} />
                      <span className="text-xs text-muted-foreground min-w-[80px]">{b.name}</span>
                      <span className="font-mono text-xs text-foreground font-semibold ml-auto">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top 5 At-Risk */}
            <div className="panel p-6">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Top 5 At-Risk Agencies</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2.5 font-medium">Agency</th>
                    <th className="text-center py-2.5 font-medium">Score</th>
                    <th className="text-center py-2.5 font-medium">Band</th>
                    <th className="text-right py-2.5 font-medium">Exposure</th>
                    <th className="text-center py-2.5 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topAtRisk.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors" onClick={() => navigate(`/agency/${a.id}`)}>
                      <td className="py-2.5 text-foreground font-medium">{a.name}</td>
                      <td className="text-center font-mono text-foreground font-semibold">{a.trustScore}</td>
                      <td className="text-center"><span className={getBandClass(a.band)}>{a.band}</span></td>
                      <td className="text-right font-mono text-foreground">{formatCurrency(a.outstandingBalance)}</td>
                      <td className="text-center">{a.trustScore < 40 ? <TrendingDown className="w-3.5 h-3.5 text-destructive inline" /> : <TrendingUp className="w-3.5 h-3.5 text-band-clear inline" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Live Event Feed */}
            <div className="panel p-6">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Live Event Feed</h3>
              <div className="space-y-0 max-h-[220px] overflow-y-auto pr-1">
                {liveEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
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

            {/* Heatmap */}
            <div className="panel p-6">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Signal Activity Heatmap</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      {days.map(d => <th key={d} className="text-center text-muted-foreground font-normal py-1">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s, si) => (
                      <tr key={s}>
                        <td className="font-mono text-muted-foreground text-[10px] py-0.5">{s}</td>
                        {days.map((_, di) => {
                          const val = heatmapData[si][di];
                          const opacity = Math.min(val / 5, 1);
                          return (
                            <td key={di} className="p-0.5">
                              <div className="w-full h-6 rounded" style={{ background: `hsl(222, 47%, 25%, ${opacity * 0.6 + 0.04})` }} title={`${val} agencies`} />
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
        </div>

        {/* Bottom — Score Timeline */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Score Movement Timeline — 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="date" tick={chartTickStyle} axisLine={chartAxisStyle} />
              <YAxis domain={[30, 80]} tick={chartTickStyle} axisLine={chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="avgScore" stroke="hsl(222, 47%, 25%)" strokeWidth={2} dot={false} />
              {scoreHistory.filter(d => d.event).map((d, i) => (
                <ReferenceLine key={i} x={d.date} stroke="hsl(0, 72%, 51%)" strokeDasharray="4 4" label={{ value: d.event, position: 'top', fill: 'hsl(215, 16%, 47%)', fontSize: 9 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;

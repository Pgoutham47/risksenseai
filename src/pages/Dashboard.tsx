import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import {
  AlertTriangle, Activity, TrendingDown, TrendingUp, CreditCard,
  Zap, XCircle, Clock, Plane, FileText, ShieldAlert, CheckCircle,
  ArrowUpRight, MapPin, HelpCircle, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  agencies, liveEvents, generateScoreHistory, generateHeatmapData,
  getBandClass, getBandColor, formatCurrency, type Band
} from '@/data/mockData';
import { AnimatedScore, AnimatedCurrency, PageTransition, DashboardSkeleton } from '@/components/AnimatedComponents';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

// ── Live Event Feed with auto-cycle ─────────────────────────────
const CYCLE_INTERVAL = 4000;
const VISIBLE_EVENTS = 6;

const generateFreshTimestamp = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

const LiveEventFeed: React.FC = () => {
  const navigate = useNavigate();
  const [visibleEvents, setVisibleEvents] = useState(liveEvents.slice(0, VISIBLE_EVENTS));
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const poolIndexRef = useRef(VISIBLE_EVENTS);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = poolIndexRef.current % liveEvents.length;
      const nextEvent = {
        ...liveEvents[nextIndex],
        id: `${liveEvents[nextIndex].id}-${Date.now()}`,
        timestamp: generateFreshTimestamp(),
      };
      poolIndexRef.current += 1;
      setEnteringId(nextEvent.id);
      setVisibleEvents(prev => [nextEvent, ...prev.slice(0, VISIBLE_EVENTS - 1)]);
      setTimeout(() => setEnteringId(null), 500);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel-glass p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Live Event Feed</h3>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-band-clear pulse-live" />
          LIVE
        </span>
      </div>
      <div className="space-y-0 max-h-[260px] overflow-hidden pr-1">
        {visibleEvents.map(ev => {
          const matchedAgency = agencies.find(a => a.name === ev.agencyName);
          return (
            <div
              key={ev.id}
              onClick={() => matchedAgency && navigate(`/agency/${matchedAgency.id}`)}
              className={`flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0 hover:bg-accent/[0.03] rounded-md px-1 transition-all duration-500 ${matchedAgency ? 'cursor-pointer' : ''} ${enteringId === ev.id ? 'animate-slide-in-event' : ''}`}
            >
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
          );
        })}
      </div>
    </div>
  );
};

// ── Interactive Risk Map (grid-based) ───────────────────────────
const regions = [
  { name: 'North', agencies: agencies.filter((_, i) => i % 4 === 0) },
  { name: 'South', agencies: agencies.filter((_, i) => i % 4 === 1) },
  { name: 'East', agencies: agencies.filter((_, i) => i % 4 === 2) },
  { name: 'West', agencies: agencies.filter((_, i) => i % 4 === 3) },
];

const RiskMap: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionRisk = (regionAgencies: typeof agencies) => {
    if (regionAgencies.length === 0) return 'CLEAR' as Band;
    const avgScore = regionAgencies.reduce((s, a) => s + a.trustScore, 0) / regionAgencies.length;
    if (avgScore < 25) return 'BLOCKED' as Band;
    if (avgScore < 40) return 'RESTRICTED' as Band;
    if (avgScore < 55) return 'WARNING' as Band;
    if (avgScore < 70) return 'CAUTION' as Band;
    return 'CLEAR' as Band;
  };

  return (
    <div className="panel-glass p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin className="w-4 h-4 text-accent" />
        <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Risk Distribution Map</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {regions.map(region => {
          const band = getRegionRisk(region.agencies);
          const isHovered = hoveredRegion === region.name;
          return (
            <motion.div
              key={region.name}
              onMouseEnter={() => setHoveredRegion(region.name)}
              onMouseLeave={() => setHoveredRegion(null)}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-xl p-4 cursor-pointer transition-all border"
              style={{
                background: `${getBandColor(band)}${isHovered ? '22' : '12'}`,
                borderColor: `${getBandColor(band)}${isHovered ? '55' : '25'}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-heading tracking-wider text-foreground">{region.name}</span>
                <span className={getBandClass(band)}>{band}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-foreground">{region.agencies.length}</span>
                <span className="text-[10px] text-muted-foreground">agencies</span>
              </div>
              {/* Mini dots for each agency */}
              <div className="flex flex-wrap gap-1 mt-2">
                {region.agencies.map(a => (
                  <div
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); navigate(`/agency/${a.id}`); }}
                    className="w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-150"
                    style={{ background: getBandColor(a.band) }}
                    title={`${a.name} — ${a.band} (${a.trustScore})`}
                  />
                ))}
              </div>
              {/* Hover tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 pt-2 border-t border-border/30 space-y-1"
                >
                  {region.agencies.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-[10px]" onClick={() => navigate(`/agency/${a.id}`)}>
                      <span className="text-foreground truncate">{a.name}</span>
                      <span className="font-mono text-muted-foreground">{a.trustScore}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border/30">
        {(['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => (
          <div key={b} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: getBandColor(b) }} />
            <span className="text-[9px] text-muted-foreground uppercase">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Pull-to-refresh hook ────────────────────────────────────────
function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const THRESHOLD = 80;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0 && el.scrollTop <= 0) {
        e.preventDefault();
        setPulling(true);
        setPullDistance(Math.min(dy * 0.5, 120));
      }
    };

    const onTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      if (pullDistance >= THRESHOLD) {
        setRefreshing(true);
        setPullDistance(THRESHOLD * 0.6);
        await onRefresh();
        setRefreshing(false);
      }
      setPulling(false);
      setPullDistance(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  const indicator = (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200 md:hidden"
      style={{ height: pulling || refreshing ? pullDistance : 0 }}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center transition-transform ${refreshing ? 'animate-spin' : ''}`}
        style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    </div>
  );

  return { containerRef, indicator };
}

// ── Walkthrough Steps ───────────────────────────────────────────
const WALKTHROUGH_STEPS = [
  {
    target: 'kpi-strip',
    title: 'KPI Overview',
    description: 'These cards show your key metrics at a glance. Click any card to drill into its detail page — Agencies, Alerts, or Analytics.',
    position: 'bottom' as const,
  },
  {
    target: 'tab-bar',
    title: 'Dashboard Tabs',
    description: 'Switch between Overview, Signals, Trends, and Risk Map views to explore different angles of your portfolio risk.',
    position: 'bottom' as const,
  },
  {
    target: 'risk-donut',
    title: 'Risk Distribution',
    description: 'This donut chart breaks down your agencies by risk band. Hover over segments to see counts.',
    position: 'right' as const,
  },
  {
    target: 'at-risk-table',
    title: 'Top At-Risk Agencies',
    description: 'The 5 lowest-scoring agencies are flagged here. Click any row to view the full agency profile with signal breakdown.',
    position: 'top' as const,
  },
  {
    target: 'live-feed',
    title: 'Live Event Feed',
    description: 'Real-time events stream in every 4 seconds. Click an event to jump to the associated agency profile.',
    position: 'left' as const,
  },
];

const Walkthrough: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const current = WALKTHROUGH_STEPS[step];
  const total = WALKTHROUGH_STEPS.length;

  useEffect(() => {
    const el = document.getElementById(current.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('walkthrough-highlight');
      return () => el.classList.remove('walkthrough-highlight');
    }
  }, [step, current.target]);

  const next = () => step < total - 1 ? setStep(step + 1) : onClose();
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px] z-[70]" onClick={onClose} />
      {/* Tooltip */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[71] bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md"
      >
        <div className="panel-glass border border-border shadow-2xl p-5 mx-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {step + 1}
              </div>
              <h3 className="text-sm font-heading tracking-wider text-foreground">{current.title}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{current.description}</p>
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {WALKTHROUGH_STEPS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-primary' : i < step ? 'bg-accent/50' : 'bg-muted-foreground/20'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors press-scale">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              )}
              <button onClick={next} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors press-scale">
                {step === total - 1 ? 'Done' : 'Next'} {step < total - 1 && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ── Dashboard ──────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    return !localStorage.getItem('dashboard-walkthrough-done');
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshKey(k => k + 1);
    setLoading(false);
  }, []);

  const { containerRef, indicator } = usePullToRefresh(handleRefresh);

  const scoreHistory = useMemo(() => generateScoreHistory(timeRangeDays[timeRange]), [timeRange, refreshKey]);

  const closeWalkthrough = useCallback(() => {
    setShowWalkthrough(false);
    localStorage.setItem('dashboard-walkthrough-done', '1');
  }, []);

  const kpis = [
    { label: 'Agencies Monitored', value: totalAgencies, icon: <Activity className="w-5 h-5" />, sparkData: kpiSparklines.agencies, sparkColor: 'hsl(var(--accent))', link: '/agencies', trend: '+2', trendUp: true },
    { label: 'Warning or Worse', value: warningOrWorse, icon: <AlertTriangle className="w-5 h-5" />, danger: true, sparkData: kpiSparklines.warnings, sparkColor: 'hsl(var(--destructive))', link: '/agencies?band=WARNING', trend: '+1', trendUp: false },
    { label: 'Alerts (24h)', value: 8, icon: <Zap className="w-5 h-5" />, sparkData: kpiSparklines.alerts, sparkColor: 'hsl(var(--accent))', link: '/alerts', trend: '-3', trendUp: true },
    { label: 'Credit Exposure', value: totalExposure, rawCurrency: true, icon: <CreditCard className="w-5 h-5" />, sparkData: kpiSparklines.exposure, sparkColor: 'hsl(var(--accent))', link: '/analytics', trend: '+₹2.1L', trendUp: false },
  ];

  if (loading) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div ref={containerRef} className="space-y-5 -m-4 md:-m-6 p-4 md:p-6 overflow-auto h-[calc(100vh-3.5rem)]">
        {indicator}

        {/* Walkthrough trigger */}
        <div className="flex justify-end -mb-3">
          <button
            onClick={() => setShowWalkthrough(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-colors press-scale"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Tour
          </button>
        </div>

        {/* ── Full-width KPI Hero Strip ─────────────────────────── */}
        <div id="kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
              className="kpi-card cursor-pointer"
              onClick={() => navigate(kpi.link)}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</p>
                <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--accent) / 0.08)' }}>
                  <span className={kpi.danger ? 'text-destructive' : 'text-accent'}>{kpi.icon}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  {kpi.rawCurrency ? (
                    <p className="text-2xl font-bold text-foreground">
                      <AnimatedCurrency value={kpi.value} />
                    </p>
                  ) : (
                    <p className={`text-2xl font-bold ${kpi.danger ? 'text-destructive' : 'text-foreground'}`}>
                      <AnimatedScore value={kpi.value as number} />
                    </p>
                  )}
                  {/* Trend arrow */}
                  <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${kpi.trendUp ? 'text-band-clear' : 'text-destructive'}`}>
                    {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{kpi.trend}</span>
                    <span className="text-muted-foreground ml-0.5">vs 7d</span>
                  </div>
                </div>
                <MiniSparkline data={kpi.sparkData} color={kpi.sparkColor} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabbed Dashboard Sections ─────────────────────────── */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList id="tab-bar" className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-5 overflow-x-auto">
            <TabsTrigger value="overview" className="text-xs font-heading tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-xs font-heading tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Signals
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs font-heading tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Trends
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs font-heading tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Risk Map
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ──────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Risk Distribution — Donut */}
              <div id="risk-donut" className="lg:col-span-4 panel-glass p-6">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-mono text-3xl font-bold text-foreground"><AnimatedScore value={totalAgencies} /></span>
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

              {/* Top 5 At-Risk */}
              <div id="at-risk-table" className="lg:col-span-8 panel-glass p-6">
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
              <div id="live-feed" className="lg:col-span-5">
                <LiveEventFeed />
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
          </TabsContent>

          {/* ── Signals Tab ──────────────────────────────────── */}
          <TabsContent value="signals" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Full-width heatmap */}
              <div className="lg:col-span-12 panel-glass p-6">
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
                                  className="w-full h-9 rounded-md transition-colors duration-200 flex items-center justify-center cursor-default group relative"
                                  style={{ background: `hsl(var(--chart-heatmap) / ${opacity * 0.55 + 0.04})` }}
                                >
                                  <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-foreground/70">{val}</span>
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
              {/* Live Event Feed */}
              <div className="lg:col-span-5">
                <LiveEventFeed />
              </div>
              {/* Signal breakdown cards */}
              <div className="lg:col-span-7 panel-glass p-6">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Top Triggered Signals</h3>
                <div className="space-y-3">
                  {signals.slice(0, 5).map((s, i) => {
                    const total = heatmapData[i].reduce((a, b) => a + b, 0);
                    const max = Math.max(...signals.map((_, si) => heatmapData[si].reduce((a, b) => a + b, 0)));
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground w-6">{s}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(total / max) * 100}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: 'hsl(var(--accent))' }}
                          />
                        </div>
                        <span className="font-mono text-xs text-foreground font-semibold w-8 text-right">{total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Trends Tab ──────────────────────────────────── */}
          <TabsContent value="trends" className="space-y-5 mt-0">
            {/* Score Timeline */}
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
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--chart-axis))' }} />
                  <YAxis domain={[30, 80]} tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--chart-axis))' }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="avgScore" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#scoreGradient)" dot={false} activeDot={{ r: 4, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--card))', strokeWidth: 2 }} />
                  {scoreHistory.filter(d => d.event).map((d, i) => (
                    <ReferenceLine key={i} x={d.date} stroke="hsl(var(--destructive) / 0.5)" strokeDasharray="4 4" label={{ value: d.event, position: 'top', fill: 'hsl(var(--chart-tick))', fontSize: 9 }} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution + At-Risk side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="panel-glass p-6">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Band Distribution</h3>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={bandDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                        {bandDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
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
              <div className="panel-glass p-6">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Exposure by Band</h3>
                <div className="space-y-3">
                  {(['BLOCKED', 'RESTRICTED', 'WARNING', 'CAUTION', 'CLEAR'] as Band[]).map(band => {
                    const bandAgencies = agencies.filter(a => a.band === band);
                    const exposure = bandAgencies.reduce((s, a) => s + a.outstandingBalance, 0);
                    return (
                      <div key={band} className="flex items-center gap-3">
                        <span className={`${getBandClass(band)} w-20 text-center`}>{band}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(exposure / totalExposure) * 100}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: getBandColor(band) }}
                          />
                        </div>
                        <span className="font-mono text-xs text-foreground w-16 text-right">{formatCurrency(exposure)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Risk Map Tab ─────────────────────────────────── */}
          <TabsContent value="map" className="mt-0">
            <RiskMap />
          </TabsContent>
        </Tabs>
      </div>
      {/* Walkthrough overlay */}
      <AnimatePresence>
        {showWalkthrough && !loading && <Walkthrough onClose={closeWalkthrough} />}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Dashboard;

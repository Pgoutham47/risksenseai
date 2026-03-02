import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { ArrowLeft, Clock, Users, MapPin, ChevronRight, Shield, LogIn, Search, Plane, CreditCard, AlertTriangle, Key, Monitor, Zap, FileText, XCircle, Edit, Ticket, Receipt, Ban, TrendingUp } from 'lucide-react';
import { getBandClass, getBandColor, formatCurrency } from '@/lib/utils';
import { type Band } from '@/lib/constants';
import { AnimatedScore, SignalGauge, PageTransition } from '@/components/AnimatedComponents';
import { toast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { api, API_BASE, AgencyActionOut, DecisionOut } from '@/lib/api';

const bandThresholds = [
  { min: 0, max: 15, band: 'BLOCKED' as Band, color: getBandColor('BLOCKED') },
  { min: 16, max: 35, band: 'RESTRICTED' as Band, color: getBandColor('RESTRICTED') },
  { min: 36, max: 55, band: 'WARNING' as Band, color: getBandColor('WARNING') },
  { min: 56, max: 75, band: 'CAUTION' as Band, color: getBandColor('CAUTION') },
  { min: 76, max: 100, band: 'CLEAR' as Band, color: getBandColor('CLEAR') },
];

const phaseDescriptions: Record<number, string> = {
  1: 'No chargeback indicators detected. Standard monitoring in place.',
  2: 'Early escalation patterns: rising refundable bookings and cancellation frequency suggest setup phase for chargeback.',
  3: 'Crystallisation: high-value refundable bookings followed by rapid cancellations. Active chargeback threat confirmed.',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login_success: <LogIn className="w-3.5 h-3.5" />,
  login_failed: <Ban className="w-3.5 h-3.5" />,
  password_reset_request: <Key className="w-3.5 h-3.5" />,
  device_change: <Monitor className="w-3.5 h-3.5" />,
  session_heartbeat: <Zap className="w-3.5 h-3.5" />,
  mfa_challenge_failed: <AlertTriangle className="w-3.5 h-3.5" />,
  flight_search: <Plane className="w-3.5 h-3.5" />,
  hotel_search: <Search className="w-3.5 h-3.5" />,
  fare_quote_request: <FileText className="w-3.5 h-3.5" />,
  booking_created: <Ticket className="w-3.5 h-3.5" />,
  booking_modified: <Edit className="w-3.5 h-3.5" />,
  booking_cancelled: <XCircle className="w-3.5 h-3.5" />,
  ticket_issued: <Ticket className="w-3.5 h-3.5" />,
  invoice_generated: <Receipt className="w-3.5 h-3.5" />,
  payment_received: <CreditCard className="w-3.5 h-3.5" />,
  payment_failed: <Ban className="w-3.5 h-3.5" />,
  credit_limit_request: <TrendingUp className="w-3.5 h-3.5" />,
};

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Login Success',
  login_failed: 'Login Failed',
  password_reset_request: 'Password Reset',
  device_change: 'Device Change',
  session_heartbeat: 'Session Heartbeat',
  mfa_challenge_failed: 'MFA Failed',
  flight_search: 'Flight Search',
  hotel_search: 'Hotel Search',
  fare_quote_request: 'Fare Quote',
  booking_created: 'Booking Created',
  booking_modified: 'Booking Modified',
  booking_cancelled: 'Booking Cancelled',
  ticket_issued: 'Ticket Issued',
  invoice_generated: 'Invoice Generated',
  payment_received: 'Payment Received',
  payment_failed: 'Payment Failed',
  credit_limit_request: 'Credit Limit Request',
};

const CATEGORY_COLORS: Record<string, string> = {
  access: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  search: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  booking: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  settlement: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function formatMetadata(jsonStr: string): string {
  try {
    const meta = JSON.parse(jsonStr);
    const parts: string[] = [];
    if (meta.ip) parts.push(`IP: ${meta.ip}`);
    if (meta.geo) parts.push(meta.geo);
    if (meta.device) parts.push(meta.device);
    if (meta.origin && meta.destination) parts.push(`${meta.origin} → ${meta.destination}`);
    if (meta.city) parts.push(`City: ${meta.city}`);
    if (meta.pax) parts.push(`${meta.pax} pax`);
    if (meta.rooms) parts.push(`${meta.rooms} rooms`);
    if (meta.route) parts.push(`Route: ${meta.route}`);
    if (meta.ref) parts.push(`Ref: ${meta.ref}`);
    if (meta.guest) parts.push(meta.guest);
    if (meta.dest) parts.push(`→ ${meta.dest}`);
    if (meta.value) parts.push(`₹${Number(meta.value).toLocaleString()}`);
    if (meta.quoted_price) parts.push(`₹${Number(meta.quoted_price).toLocaleString()}`);
    if (meta.refundable !== undefined) parts.push(meta.refundable ? 'Refundable' : 'Non-refundable');
    if (meta.lead_days) parts.push(`${meta.lead_days}d lead`);
    if (meta.invoice) parts.push(`Inv: ${meta.invoice}`);
    if (meta.amount) parts.push(`₹${Number(meta.amount).toLocaleString()}`);
    if (meta.method) parts.push(meta.method);
    if (meta.reason) parts.push(meta.reason);
    if (meta.attempts) parts.push(`${meta.attempts} attempts`);
    if (meta.session_length) parts.push(meta.session_length);
    if (meta.nav_speed) parts.push(`Speed: ${meta.nav_speed}`);
    if (meta.old_device) parts.push(`${meta.old_device} → ${meta.new_device}`);
    if (meta.old_name) parts.push(`${meta.old_name} → ${meta.new_name}`);
    if (meta.target_email) parts.push(meta.target_email);
    if (meta.challenge_type) parts.push(meta.challenge_type);
    if (meta.requested_amount) parts.push(`Requested: ₹${Number(meta.requested_amount).toLocaleString()}`);
    if (meta.time_since_booking) parts.push(`After ${meta.time_since_booking}`);
    if (meta.pnr) parts.push(`PNR: ${meta.pnr}`);
    if (meta.dates) parts.push(meta.dates);
    if (meta.checkin) parts.push(`Check-in: ${meta.checkin}`);
    if (meta.due_date) parts.push(`Due: ${meta.due_date}`);
    return parts.join(' · ');
  } catch {
    return jsonStr;
  }
}

const getNextStepAdvice = (state: string, tenure: number) => {
  if (tenure < 30) {
    return `You are in the 30-day probationary phase. Establish consistent trading and payment history for ${30 - tenure} more days to unlock full credit line access.`;
  }
  switch (state) {
    case 'FULL':
      return 'Your account is trading at maximum efficiency. Maintain strong performance to keep full access to your credit limit.';
    case 'SOFT_WATCH':
    case 'SURGICAL':
      return 'Recommendation: Pay your next 3 invoices early or keep Settlement Delay (S8) below 0.10 for 30 days to automatically remove surgical caps.';
    case 'MODERATE_CONTRACT':
    case 'HARD_CONTRACT':
      return 'Recommendation: Pay all invoices on time and reduce credit utilization below 60% to automatically restore your credit limits and booking autonomy.';
    case 'FROZEN':
      return 'Your account is frozen due to missed payments or critical risk flags. Please contact support immediately to resolve outstanding issues.';
    default:
      return 'Maintain good trading behavior to grow your credit.';
  }
};

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'access', label: 'Access' },
  { key: 'search', label: 'Search' },
  { key: 'booking', label: 'Booking' },
  { key: 'settlement', label: 'Settlement' },
];

const AgencyProfile: React.FC = () => {
  const { agencies, isLoading: contextLoading } = useData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agency = agencies.find(a => a.id === id);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideBand, setOverrideBand] = useState<Band>('WARNING');
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBand, setCurrentBand] = useState<Band | null>(null);
  const [actionCategory, setActionCategory] = useState('all');

  const { data: actions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['agencyActions', id, actionCategory],
    queryFn: () => api.getAgencyActions(id!, 100, actionCategory === 'all' ? undefined : actionCategory),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // Fetch live decision history from API
  const { data: decisions = [] } = useQuery<DecisionOut[]>({
    queryKey: ['decisions', id],
    queryFn: () => api.getAgencyDecisions(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ['scoreHistory', id],
    queryFn: () => api.getAgencyScoreHistory(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: investigation } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => api.getInvestigation(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  if (!agency) {
    if (contextLoading) {
      // Don't flash "Not Found" if the global context is just syncing API data on mount.
      return (
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-background space-y-5 relative min-h-[calc(100vh-5rem)]">
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 panel-glass p-6">
              <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <p className="text-xs font-heading tracking-wider text-muted-foreground animate-pulse">LOADING AGENCY PROFILE...</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p className="text-lg font-heading">Agency Not Found</p>
          <button onClick={() => navigate('/agencies')} className="mt-4 text-primary text-sm hover:underline">← Back to Directory</button>
        </div>
      </PageTransition>
    );
  }

  const displayBand = currentBand || agency.band;

  const nextBandUp = bandThresholds.find(b => b.min > agency.trustScore);

  const handleConfirmOverride = async () => {
    try {
      const res = await fetch(`${API_BASE}/agencies/${agency.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: overrideNotes,
          band: overrideBand
        })
      });

      if (!res.ok) throw new Error('Failed to override agency band');

      toast({
        title: 'Override Applied',
        description: `${agency.name} band manually set to ${overrideBand}. This action has been logged in the audit trail.`,
      });

      setShowConfirm(false);
      setShowOverride(false);
      setOverrideNotes('');

      // Refresh the page or trigger a data refetch to show the new band
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Override Failed',
        description: 'Failed to apply the manual override. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <button onClick={() => navigate('/agencies')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        {/* Header Card */}
        <div className="panel p-6">
          <div className="flex flex-wrap items-start gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-heading text-2xl text-foreground tracking-wider">{agency.name}</h2>
                <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{agency.id}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={getBandClass(displayBand)}>{displayBand}</span>
                {currentBand && currentBand !== agency.band && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent">MANUALLY OVERRIDDEN</span>
                )}
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {agency.tenure} days tenure</span>
                <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {agency.cohort}</span>
                <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Updated: {agency.lastUpdated}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground font-medium mb-1">TRUST SCORE</p>
              <div className="text-5xl font-mono font-bold" style={{ color: getBandColor(displayBand) }}>
                <AnimatedScore value={agency.trustScore} />
              </div>
            </div>
            <div className="space-y-2 text-xs min-w-[180px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Credit Limit</span><span className="font-mono text-foreground font-semibold">{formatCurrency(agency.creditLimit)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-mono text-foreground font-semibold">{formatCurrency(agency.outstandingBalance)}</span></div>
              <div>
                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Utilization</span><span className="font-mono text-foreground font-semibold">{agency.utilization}%</span></div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${agency.utilization}%`, background: agency.utilization > 70 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))' }} />
                </div>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Credit Ladder State</span>
                <span className={`font-mono text-xs font-semibold ${agency.credit_ladder_state === 'FULL' ? 'text-emerald-400' :
                  agency.credit_ladder_state === 'SOFT_WATCH' ? 'text-amber-400' :
                    agency.credit_ladder_state === 'FROZEN' ? 'text-red-500' : 'text-orange-400'
                  }`}>
                  {agency.credit_ladder_state?.replace('_', ' ') || 'FULL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Counterfactual Guidance */}
        {nextBandUp && (
          <div className="panel p-6 border-l-4" style={{ borderLeftColor: getBandColor(nextBandUp.band) }}>
            <h3 className="font-heading text-sm tracking-wider text-foreground mb-3">Recovery Guidance — Move from {displayBand} → {nextBandUp.band}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {investigation?.signals.filter(s => s.value > 0.3).slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-secondary/60 rounded-lg p-3">
                  <div>
                    <span className="text-muted-foreground">{s.name}</span>
                    <p className="font-mono text-foreground font-semibold mt-0.5">Current: {s.value.toFixed(2)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-right">
                    <span className="text-muted-foreground">Target</span>
                    <p className="font-mono font-semibold" style={{ color: getBandColor(nextBandUp.band) }}>{'< 0.30'}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Estimated timeline: 12–15 days of normal trading activity</p>
          </div>
        )}

        {/* Signal Score Cards */}
        <div>
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Signal Scores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {investigation?.signals.map(s => (
              <div key={s.id} className="panel p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.status === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : s.status === 'ELEVATED' ? 'bg-band-warning/10 text-band-warning' : 'bg-band-clear/10 text-band-clear'}`}>{s.status}</span>
                </div>
                <p className="text-xs text-foreground font-medium">{s.name}</p>
                <div className="flex items-center justify-center">
                  <SignalGauge score={s.value} />
                </div>
                <span className="inline-block text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{s.fraud_type}</span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Weight: {(s.weight * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ACTIVITY LOG ═══ */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Activity Log — All Monitored Actions</h3>
            <span className="font-mono text-xs text-muted-foreground">{actions.length} actions</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1 mb-5 bg-secondary/50 p-1 rounded-lg w-fit">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActionCategory(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-heading tracking-wider uppercase transition-all ${actionCategory === tab.key
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions List */}
          {actionsLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading actions...</div>
          ) : actions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No actions found for this category.</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {actions.map((action: AgencyActionOut) => {
                const isSuspicious = !!action.risk_indicator;
                return (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isSuspicious
                      ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/8'
                      : 'border-border/50 bg-card/30 hover:bg-card/60'
                      }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSuspicious ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground'
                      }`}>
                      {ACTION_ICONS[action.action_type] || <Zap className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-heading text-xs tracking-wider ${isSuspicious ? 'text-destructive font-semibold' : 'text-foreground'}`}>
                          {ACTION_LABELS[action.action_type] || action.action_type}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-widest ${CATEGORY_COLORS[action.category] || 'bg-secondary text-muted-foreground'}`}>
                          {action.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono leading-relaxed truncate">
                        {formatMetadata(action.metadata_json)}
                      </p>
                      {isSuspicious && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                          <span className="text-[10px] text-destructive font-semibold">{action.risk_indicator}</span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {new Date(action.timestamp + 'Z').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trust Score History */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Trust Score History — 90 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={scoreHistory}>
              {bandThresholds.map(b => (
                <ReferenceArea key={b.band} y1={b.min} y2={b.max} fill={b.color} fillOpacity={0.06} />
              ))}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 9 }} interval={10} axisLine={{ stroke: 'hsl(var(--chart-axis))' }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 9 }} axisLine={{ stroke: 'hsl(var(--chart-axis))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="score" stroke={getBandColor(displayBand)} strokeWidth={2} dot={false} />
              {scoreHistory.filter(d => d.event).map((d, i) => (
                <ReferenceLine key={i} x={d.date} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: d.event || '', position: 'top', fill: 'hsl(var(--chart-tick))', fontSize: 8 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chargeback Phase */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Chargeback Early Warning</h3>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(phase => {
              const currentPhase = Math.max(1, investigation?.chargeback_phase?.phase || 1);
              return (
                <React.Fragment key={phase}>
                  <div className={`flex-1 rounded-lg p-3 text-center transition-all ${currentPhase >= phase ? 'bg-destructive/8 border border-destructive/20' : 'bg-secondary border border-border'}`}>
                    <p className={`font-heading text-xs tracking-wider ${currentPhase >= phase ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Phase {phase}: {phase === 1 ? 'Setup' : phase === 2 ? 'Escalation' : 'Crystallisation'}
                    </p>
                    {currentPhase === phase && (
                      <div className="w-full h-0.5 bg-destructive mt-2 rounded-full pulse-live" />
                    )}
                  </div>
                  {phase < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{investigation?.chargeback_phase?.phase_description || phaseDescriptions[1]}</p>
        </div>

        {/* Decision History */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Decision History</h3>
          {decisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No decisions yet</p>
              <p className="text-xs mt-1">Use the Simulator Widget to inject actions and generate decisions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-muted-foreground border-b border-border"><th className="text-left py-2.5 font-medium">Timestamp</th><th className="text-center py-2.5 font-medium">Score</th><th className="text-center py-2.5 font-medium">Band</th><th className="text-left py-2.5 font-medium">Credit Action</th><th className="text-left py-2.5 font-medium">Explanation</th></tr></thead>
                <tbody>
                  {decisions.map((d) => (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="py-2.5 font-mono text-muted-foreground">{d.decided_at ? new Date(d.decided_at + 'Z').toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="text-center font-mono text-foreground font-semibold">{d.trust_score}</td>
                      <td className="text-center"><span className={getBandClass(d.band as Band)}>{d.band}</span></td>
                      <td className="py-2.5 text-muted-foreground">{d.credit_action || '—'}</td>
                      <td className="py-2.5 text-foreground">{d.explanation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Analyst Override */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Analyst Override</h3>
          {!showOverride ? (
            <button onClick={() => setShowOverride(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Override Decision</button>
          ) : (
            <div className="space-y-3 max-w-lg">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Analyst Notes</label>
                <textarea value={overrideNotes} onChange={e => setOverrideNotes(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none" placeholder="Justification for override..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Set Manual Band</label>
                <select value={overrideBand} onChange={e => setOverrideBand(e.target.value as Band)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40">
                  {(['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!overrideNotes.trim()) {
                      toast({ title: 'Notes Required', description: 'Please provide justification for the override.', variant: 'destructive' });
                      return;
                    }
                    setShowConfirm(true);
                  }}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Confirm Override
                </button>
                <button onClick={() => { setShowOverride(false); setOverrideNotes(''); }} className="bg-secondary text-muted-foreground px-5 py-2.5 rounded-lg text-sm hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
            <div className="panel p-6 max-w-md w-full mx-4 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading text-lg tracking-wider text-foreground">Confirm Override</h3>
              <p className="text-sm text-muted-foreground">You are about to manually override {agency.name}'s band to <span className={getBandClass(overrideBand)}>{overrideBand}</span>. This action will be logged.</p>
              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Analyst Notes:</p>
                <p>{overrideNotes}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowConfirm(false)} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm hover:text-foreground">Cancel</button>
                <button onClick={handleConfirmOverride} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition >
  );
};

export default AgencyProfile;

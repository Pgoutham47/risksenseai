import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { ArrowLeft, Clock, Users, MapPin, ChevronRight } from 'lucide-react';
import { agencies, generateAgencyScoreHistory, getBandClass, getBandColor, formatCurrency, decisionHistory, type Band } from '@/data/mockData';
import { AnimatedScore, SignalGauge, PageTransition } from '@/components/AnimatedComponents';
import { toast } from '@/hooks/use-toast';

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

const AgencyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agency = agencies.find(a => a.id === id);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideBand, setOverrideBand] = useState<Band>('WARNING');
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBand, setCurrentBand] = useState<Band | null>(null);

  if (!agency) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <p className="text-lg font-heading">Agency Not Found</p>
        <button onClick={() => navigate('/agencies')} className="mt-4 text-primary text-sm hover:underline">← Back to Directory</button>
      </div>
    </PageTransition>
  );

  const displayBand = currentBand || agency.band;
  const scoreHistory = generateAgencyScoreHistory(agency.trustScore);
  const decisions = decisionHistory[agency.id] || [
    { timestamp: agency.lastUpdated, trustScore: agency.trustScore, band: agency.band, topSignals: [agency.signals[0]?.id || 'S1'], action: 'Automated assessment' },
  ];

  const nextBandUp = bandThresholds.find(b => b.min > agency.trustScore);

  const handleConfirmOverride = () => {
    setCurrentBand(overrideBand);
    setShowConfirm(false);
    setShowOverride(false);
    toast({
      title: 'Override Applied',
      description: `${agency.name} band manually set to ${overrideBand}. This action has been logged in the audit trail.`,
    });
    setOverrideNotes('');
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
            </div>
          </div>
        </div>

        {/* Counterfactual Guidance */}
        {nextBandUp && (
          <div className="panel p-6 border-l-4" style={{ borderLeftColor: getBandColor(nextBandUp.band) }}>
            <h3 className="font-heading text-sm tracking-wider text-foreground mb-3">Recovery Guidance — Move from {displayBand} → {nextBandUp.band}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {agency.signals.filter(s => s.score > 0.3).slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-secondary/60 rounded-lg p-3">
                  <div>
                    <span className="text-muted-foreground">{s.name}</span>
                    <p className="font-mono text-foreground font-semibold mt-0.5">Current: {s.score.toFixed(2)}</p>
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
            {agency.signals.map(s => (
              <div key={s.id} className="panel p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.status === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : s.status === 'ELEVATED' ? 'bg-band-warning/10 text-band-warning' : 'bg-band-clear/10 text-band-clear'}`}>{s.status}</span>
                </div>
                <p className="text-xs text-foreground font-medium">{s.name}</p>
                <div className="flex items-center justify-center">
                  <SignalGauge score={s.score} />
                </div>
                <span className="inline-block text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{s.fraudType}</span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
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
            {[1, 2, 3].map(phase => (
              <React.Fragment key={phase}>
                <div className={`flex-1 rounded-lg p-3 text-center transition-all ${agency.chargebackPhase >= phase ? 'bg-destructive/8 border border-destructive/20' : 'bg-secondary border border-border'}`}>
                  <p className={`font-heading text-xs tracking-wider ${agency.chargebackPhase >= phase ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Phase {phase}: {phase === 1 ? 'Setup' : phase === 2 ? 'Escalation' : 'Crystallisation'}
                  </p>
                  {agency.chargebackPhase === phase && (
                    <div className="w-full h-0.5 bg-destructive mt-2 rounded-full pulse-live" />
                  )}
                </div>
                {phase < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{phaseDescriptions[agency.chargebackPhase]}</p>
        </div>

        {/* Decision History */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Decision History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b border-border"><th className="text-left py-2.5 font-medium">Timestamp</th><th className="text-center py-2.5 font-medium">Score</th><th className="text-center py-2.5 font-medium">Band</th><th className="text-left py-2.5 font-medium">Top Signals</th><th className="text-left py-2.5 font-medium">Action</th></tr></thead>
              <tbody>
                {decisions.map((d, i) => (
                  <tr key={i} className="border-b border-border/50"><td className="py-2.5 font-mono text-muted-foreground">{d.timestamp}</td><td className="text-center font-mono text-foreground font-semibold">{d.trustScore}</td><td className="text-center"><span className={getBandClass(d.band)}>{d.band}</span></td><td className="py-2.5 text-muted-foreground">{d.topSignals.join(', ')}</td><td className="py-2.5 text-foreground">{d.action}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </PageTransition>
  );
};

export default AgencyProfile;

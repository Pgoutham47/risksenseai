import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Sliders, RotateCcw, AlertTriangle, TrendingUp, Save, Share2, Copy, Check, Zap } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/AnimatedComponents';
import { agencies, getBandClass, type Band } from '@/data/mockData';
import { toast } from 'sonner';

const SIGNALS = [
  { id: 'S1', name: 'Booking Velocity', weight: 0.22 },
  { id: 'S2', name: 'Refundable Ratio', weight: 0.20 },
  { id: 'S3', name: 'Lead Time Compression', weight: 0.12 },
  { id: 'S4', name: 'Cancellation Cascade', weight: 0.08 },
  { id: 'S5', name: 'Credit Utilization', weight: 0.16 },
  { id: 'S6', name: 'Passenger Name Reuse', weight: 0.04 },
  { id: 'S7', name: 'Destination Spike', weight: 0.04 },
  { id: 'S8', name: 'Settlement Delay', weight: 0.14 },
];

const DEFAULT_VALUES = SIGNALS.map(() => 0.2);

function computeScore(values: number[], tenureDays: number): { trustScore: number; band: Band; risk: number } {
  let risk = SIGNALS.reduce((sum, s, i) => sum + s.weight * values[i], 0);
  if (risk > 0.5 && (values[5] > 0.5 || values[6] > 0.5)) risk = Math.min(1.0, risk * 1.15);
  if (tenureDays < 90) risk = Math.min(1.0, risk + 0.05 * (1 - tenureDays / 90));
  const trustScore = Math.round((1 - risk) * 100);
  let band: Band;
  if (trustScore >= 76) band = 'CLEAR';
  else if (trustScore >= 56) band = 'CAUTION';
  else if (trustScore >= 36) band = 'WARNING';
  else if (trustScore >= 16) band = 'RESTRICTED';
  else band = 'BLOCKED';
  return { trustScore, band, risk };
}

function getCreditAction(band: Band): string {
  switch (band) {
    case 'CLEAR': return 'Full credit available';
    case 'CAUTION': return 'No change — notify analyst';
    case 'WARNING': return 'Credit reduced to 75%';
    case 'RESTRICTED': return 'Credit reduced to 40% — approval required';
    case 'BLOCKED': return 'Credit frozen — escalate immediately';
  }
}

function getCounterfactual(values: number[], currentScore: number, band: Band): string {
  if (band === 'CLEAR') return 'Score is in CLEAR band — no action needed.';
  const targetScore = band === 'BLOCKED' ? 16 : band === 'RESTRICTED' ? 36 : band === 'WARNING' ? 56 : 76;
  const sorted = SIGNALS.map((s, i) => ({ ...s, value: values[i], index: i }))
    .sort((a, b) => b.value * b.weight - a.value * a.weight);
  const top = sorted.slice(0, 2);
  const parts = top.map(s => {
    const needed = Math.max(0, s.value - ((targetScore - currentScore) / 100) / s.weight);
    return `Reduce ${s.name} (${s.id}) from ${(s.value * 100).toFixed(0)}% to ~${(Math.max(0, needed) * 100).toFixed(0)}%`;
  });
  return `To reach ${targetScore}+ (next band): ${parts.join('; ')}.`;
}

// Sensitivity: marginal impact per signal
function computeSensitivity(values: number[], tenureDays: number): { id: string; impact: number }[] {
  const base = computeScore(values, tenureDays).trustScore;
  return SIGNALS.map((s, i) => {
    const tweaked = [...values];
    tweaked[i] = Math.min(1, values[i] + 0.05);
    const newScore = computeScore(tweaked, tenureDays).trustScore;
    return { id: s.id, impact: Math.abs(base - newScore) };
  }).sort((a, b) => b.impact - a.impact);
}

// Animated score gauge
const ScoreGauge: React.FC<{ score: number; band: Band }> = ({ score, band }) => {
  const size = 160, stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const bandColors: Record<Band, string> = {
    CLEAR: 'hsl(var(--band-clear))',
    CAUTION: 'hsl(var(--band-caution))',
    WARNING: 'hsl(var(--band-warning))',
    RESTRICTED: 'hsl(var(--band-restricted))',
    BLOCKED: 'hsl(var(--band-blocked))',
  };
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={bandColors[band]} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${bandColors[band]})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-mono text-5xl font-bold text-foreground"
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Trust Score</span>
      </div>
    </div>
  );
};

// Saved scenarios storage
interface SavedScenario {
  name: string;
  values: number[];
  tenure: number;
}

const Simulator: React.FC = () => {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [tenureDays, setTenureDays] = useState(365);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [baselineValues, setBaselineValues] = useState<number[] | null>(null);
  const [baselineTenure, setBaselineTenure] = useState<number | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try { return JSON.parse(localStorage.getItem('sim-scenarios') || '[]'); } catch { return []; }
  });
  const [scenarioName, setScenarioName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { trustScore, band, risk } = useMemo(() => computeScore(values, tenureDays), [values, tenureDays]);
  const baseline = useMemo(() => baselineValues ? computeScore(baselineValues, baselineTenure ?? 365) : null, [baselineValues, baselineTenure]);
  const sensitivity = useMemo(() => computeSensitivity(values, tenureDays), [values, tenureDays]);
  const topSensitive = sensitivity[0]?.id;

  const radarData = SIGNALS.map((s, i) => ({
    signal: s.id,
    value: values[i] * 100,
    baseline: baselineValues ? baselineValues[i] * 100 : undefined,
    fullMark: 100,
  }));

  const updateSignal = useCallback((index: number, val: number) => {
    setSelectedPreset(null);
    setValues(prev => { const next = [...prev]; next[index] = val; return next; });
  }, []);

  const loadPreset = useCallback((agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) return;
    // Set current as baseline for comparison
    setBaselineValues([...values]);
    setBaselineTenure(tenureDays);
    setSelectedPreset(agencyId);
    setTenureDays(agency.tenure);
    setValues(agency.signals.map(s => s.score));
  }, [values, tenureDays]);

  const resetAll = useCallback(() => {
    setValues(DEFAULT_VALUES);
    setTenureDays(365);
    setSelectedPreset(null);
    setBaselineValues(null);
    setBaselineTenure(null);
  }, []);

  const clearBaseline = useCallback(() => {
    setBaselineValues(null);
    setBaselineTenure(null);
  }, []);

  const setAsBaseline = useCallback(() => {
    setBaselineValues([...values]);
    setBaselineTenure(tenureDays);
    toast.success('Current state saved as baseline');
  }, [values, tenureDays]);

  const saveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;
    const scenario: SavedScenario = { name: scenarioName.trim(), values: [...values], tenure: tenureDays };
    const updated = [...savedScenarios, scenario];
    setSavedScenarios(updated);
    localStorage.setItem('sim-scenarios', JSON.stringify(updated));
    setScenarioName('');
    setShowSave(false);
    toast.success(`Scenario "${scenario.name}" saved`);
  }, [scenarioName, values, tenureDays, savedScenarios]);

  const loadScenario = useCallback((s: SavedScenario) => {
    setBaselineValues([...values]);
    setBaselineTenure(tenureDays);
    setValues(s.values);
    setTenureDays(s.tenure);
    setSelectedPreset(null);
  }, [values, tenureDays]);

  const shareUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('v', values.map(v => Math.round(v * 100)).join(','));
    params.set('t', String(tenureDays));
    const url = `${window.location.origin}/simulator?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Shareable URL copied to clipboard');
  }, [values, tenureDays]);

  // Load from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('v');
    const t = params.get('t');
    if (v) {
      const parsed = v.split(',').map(Number).map(n => n / 100);
      if (parsed.length === 8) setValues(parsed);
    }
    if (t) setTenureDays(Number(t));
  }, []);

  const scoreDiff = baseline ? trustScore - baseline.trustScore : null;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Sliders className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg tracking-wider text-foreground">Fraud Scenario Simulator</h2>
              <p className="text-xs text-muted-foreground">Adjust signals to see real-time impact on Trust Score & decision band</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={setAsBaseline} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Set Baseline
            </button>
            <button onClick={() => setShowSave(!showSave)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <button onClick={shareUrl} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Save scenario dialog */}
        <AnimatePresence>
          {showSave && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="panel p-4 overflow-hidden">
              <div className="flex items-center gap-3">
                <input
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                  placeholder="Scenario name..."
                  className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={e => e.key === 'Enter' && saveScenario()}
                />
                <button onClick={saveScenario} className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
              </div>
              {savedScenarios.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center">Saved:</span>
                  {savedScenarios.map((s, i) => (
                    <button key={i} onClick={() => loadScenario(s)} className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presets */}
        <div className="panel p-4">
          <h3 className="font-heading text-xs tracking-wider text-muted-foreground mb-3">Load Agency Preset</h3>
          <div className="flex flex-wrap gap-2">
            {agencies.slice(0, 8).map(a => (
              <button key={a.id} onClick={() => loadPreset(a.id)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                  selectedPreset === a.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                }`}
              >
                {a.name} ({a.trustScore})
              </button>
            ))}
          </div>
        </div>

        {/* Before/after banner */}
        <AnimatePresence>
          {baseline && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="panel p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Baseline:</span>
                <span className="font-mono font-semibold text-foreground">{baseline.trustScore}</span>
                <span className={getBandClass(baseline.band)}>{baseline.band}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono font-semibold text-foreground">{trustScore}</span>
                <span className={getBandClass(band)}>{band}</span>
                {scoreDiff !== null && (
                  <span className={`font-mono font-semibold ${scoreDiff > 0 ? 'text-[hsl(var(--band-clear))]' : scoreDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff} pts
                  </span>
                )}
              </div>
              <button onClick={clearBaseline} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders — Left 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Signal Values</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>Highest sensitivity: <strong className="text-foreground">{topSensitive}</strong></span>
                </div>
              </div>
              <div className="space-y-4">
                {SIGNALS.map((s, i) => {
                  const isMostSensitive = s.id === topSensitive;
                  const baseVal = baselineValues ? baselineValues[i] : null;
                  const diff = baseVal !== null ? values[i] - baseVal : null;
                  return (
                    <motion.div key={s.id} layout className={`space-y-1.5 p-2 -mx-2 rounded-lg transition-colors ${isMostSensitive ? 'bg-accent/5 ring-1 ring-accent/20' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground w-6">{s.id}</span>
                          <span className="text-xs text-foreground font-medium">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground">({(s.weight * 100).toFixed(0)}%)</span>
                          {isMostSensitive && <Zap className="w-3 h-3 text-accent" />}
                        </div>
                        <div className="flex items-center gap-2">
                          {diff !== null && diff !== 0 && (
                            <span className={`text-[10px] font-mono ${diff > 0 ? 'text-destructive' : 'text-[hsl(var(--band-clear))]'}`}>
                              {diff > 0 ? '+' : ''}{(diff * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className={`font-mono text-xs font-semibold ${
                            values[i] >= 0.7 ? 'text-destructive' : values[i] >= 0.4 ? 'text-[hsl(var(--band-warning))]' : 'text-[hsl(var(--band-clear))]'
                          }`}>
                            {(values[i] * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range" min="0" max="100"
                          value={Math.round(values[i] * 100)}
                          onChange={e => updateSignal(i, Number(e.target.value) / 100)}
                          className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        />
                        {/* Baseline marker */}
                        {baseVal !== null && (
                          <div className="absolute top-0 h-1.5 pointer-events-none" style={{ left: `${baseVal * 100}%` }}>
                            <div className="w-0.5 h-3 -mt-[3px] bg-muted-foreground/40 rounded-full" />
                          </div>
                        )}
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          animate={{ width: `${Math.min(100, values[i] * s.weight * 100 * 5)}%` }}
                          transition={{ duration: 0.3 }}
                          style={{
                            background: values[i] >= 0.7 ? 'hsl(var(--destructive))' : values[i] >= 0.4 ? 'hsl(var(--band-warning))' : 'hsl(var(--band-clear))',
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Tenure */}
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-foreground font-medium">Platform Tenure</span>
                  <span className="font-mono text-xs text-foreground font-semibold">{tenureDays} days</span>
                </div>
                <input
                  type="range" min="1" max="900" value={tenureDays}
                  onChange={e => { setTenureDays(Number(e.target.value)); setSelectedPreset(null); }}
                  className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1 day</span>
                  <span className={tenureDays < 90 ? 'text-[hsl(var(--band-warning))] font-semibold' : ''}>
                    {tenureDays < 90 ? '⚠ New agency premium active' : ''}
                  </span>
                  <span>900 days</span>
                </div>
              </div>
            </div>

            {/* Sensitivity analysis */}
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <h4 className="font-heading text-xs tracking-wider text-muted-foreground">Signal Sensitivity</h4>
                <span className="text-[10px] text-muted-foreground">— pts change per +5% increase</span>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {sensitivity.map((s, i) => (
                  <div key={s.id} className={`text-center p-2 rounded-lg transition-colors ${i === 0 ? 'bg-accent/10 ring-1 ring-accent/20' : 'bg-secondary/50'}`}>
                    <span className="font-mono text-[10px] text-muted-foreground block">{s.id}</span>
                    <span className={`font-mono text-sm font-bold block ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{s.impact}</span>
                    <span className="text-[9px] text-muted-foreground">pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results — Right col (sticky) */}
          <div ref={resultRef} className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {/* Score gauge */}
            <div className="panel p-6 flex flex-col items-center">
              <ScoreGauge score={trustScore} band={band} />
              <div className="mt-3">
                <span className={getBandClass(band)}>{band}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">Risk: {(risk * 100).toFixed(1)}%</p>
              {scoreDiff !== null && scoreDiff !== 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`text-xs font-mono font-semibold mt-1 ${scoreDiff > 0 ? 'text-[hsl(var(--band-clear))]' : 'text-destructive'}`}
                >
                  {scoreDiff > 0 ? '▲' : '▼'} {Math.abs(scoreDiff)} pts from baseline
                </motion.p>
              )}
            </div>

            {/* Credit Action */}
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">Credit Action</h4>
              </div>
              <p className="text-xs text-muted-foreground">{getCreditAction(band)}</p>
            </div>

            {/* Dark radar chart */}
            <div className="panel p-4 bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))]">
              <h4 className="font-heading text-xs tracking-wider text-[hsl(var(--sidebar-foreground))] mb-3">Signal Footprint</h4>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--sidebar-border))" />
                  <PolarAngleAxis dataKey="signal" tick={{ fill: 'hsl(var(--sidebar-foreground))', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  {baselineValues && (
                    <Radar name="Baseline" dataKey="baseline" stroke="hsl(var(--sidebar-foreground))" fill="hsl(var(--sidebar-foreground))" fillOpacity={0.08} strokeWidth={1} strokeDasharray="4 4" />
                  )}
                  <Radar name="Current" dataKey="value" stroke="hsl(var(--sidebar-primary))" fill="hsl(var(--sidebar-primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Counterfactual */}
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--band-clear))]" />
                <h4 className="text-xs font-semibold text-foreground">Recovery Guidance</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {getCounterfactual(values, trustScore, band)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Simulator;

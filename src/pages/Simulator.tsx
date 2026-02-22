import React, { useState, useMemo } from 'react';
import { Sliders, RotateCcw, AlertTriangle, TrendingUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PageTransition } from '@/components/AnimatedComponents';
import { agencies, getBandClass, type Band } from '@/data/mockData';

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

  // Amplifier
  if (risk > 0.5 && (values[5] > 0.5 || values[6] > 0.5)) {
    risk = Math.min(1.0, risk * 1.15);
  }

  // Tenure premium
  if (tenureDays < 90) {
    const premium = 0.05 * (1 - tenureDays / 90);
    risk = Math.min(1.0, risk + premium);
  }

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

const Simulator: React.FC = () => {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [tenureDays, setTenureDays] = useState(365);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const { trustScore, band, risk } = useMemo(() => computeScore(values, tenureDays), [values, tenureDays]);

  const radarData = SIGNALS.map((s, i) => ({
    signal: s.id,
    value: values[i] * 100,
    fullMark: 100,
  }));

  const updateSignal = (index: number, val: number) => {
    setSelectedPreset(null);
    const next = [...values];
    next[index] = val;
    setValues(next);
  };

  const loadPreset = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) return;
    setSelectedPreset(agencyId);
    setTenureDays(agency.tenure);
    setValues(agency.signals.map(s => s.score));
  };

  const resetAll = () => {
    setValues(DEFAULT_VALUES);
    setTenureDays(365);
    setSelectedPreset(null);
  };

  const scoreColor = band === 'CLEAR' ? 'text-band-clear' : band === 'CAUTION' ? 'text-band-caution' : band === 'WARNING' ? 'text-band-warning' : band === 'RESTRICTED' ? 'text-band-restricted' : 'text-band-blocked';

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
          <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>

        {/* Presets */}
        <div className="panel p-4">
          <h3 className="font-heading text-xs tracking-wider text-muted-foreground mb-3">Load Agency Preset</h3>
          <div className="flex flex-wrap gap-2">
            {agencies.slice(0, 8).map(a => (
              <button
                key={a.id}
                onClick={() => loadPreset(a.id)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                  selectedPreset === a.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                }`}
              >
                {a.name} ({a.trustScore})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders — Left 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="panel p-6">
              <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Signal Values</h3>
              <div className="space-y-4">
                {SIGNALS.map((s, i) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground w-6">{s.id}</span>
                        <span className="text-xs text-foreground font-medium">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">({(s.weight * 100).toFixed(0)}%)</span>
                      </div>
                      <span className={`font-mono text-xs font-semibold ${
                        values[i] >= 0.7 ? 'text-destructive' : values[i] >= 0.4 ? 'text-band-warning' : 'text-band-clear'
                      }`}>
                        {(values[i] * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(values[i] * 100)}
                        onChange={e => updateSignal(i, Number(e.target.value) / 100)}
                        className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                      />
                    </div>
                    {/* Contribution bar */}
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${values[i] * s.weight * 100 * 5}%`,
                          background: values[i] >= 0.7 ? 'hsl(var(--destructive))' : values[i] >= 0.4 ? 'hsl(var(--band-warning))' : 'hsl(var(--band-clear))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tenure */}
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-foreground font-medium">Platform Tenure</span>
                  <span className="font-mono text-xs text-foreground font-semibold">{tenureDays} days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="900"
                  value={tenureDays}
                  onChange={e => { setTenureDays(Number(e.target.value)); setSelectedPreset(null); }}
                  className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1 day</span>
                  <span className={tenureDays < 90 ? 'text-band-warning font-semibold' : ''}>
                    {tenureDays < 90 ? '⚠ New agency premium active' : ''}
                  </span>
                  <span>900 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results — Right col */}
          <div className="space-y-4">
            {/* Score card */}
            <div className="panel p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Trust Score</p>
              <p className={`font-mono text-6xl font-bold ${scoreColor}`}>{trustScore}</p>
              <div className="mt-3">
                <span className={getBandClass(band)}>{band}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-mono">Risk: {(risk * 100).toFixed(1)}%</p>
            </div>

            {/* Credit Action */}
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">Credit Action</h4>
              </div>
              <p className="text-xs text-muted-foreground">{getCreditAction(band)}</p>
            </div>

            {/* Radar chart */}
            <div className="panel p-4">
              <h4 className="font-heading text-xs tracking-wider text-muted-foreground mb-3">Signal Footprint</h4>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="signal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Signals" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Counterfactual */}
            <div className="panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-band-clear" />
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

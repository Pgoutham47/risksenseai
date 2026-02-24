import React, { useState } from 'react';
import { CheckCircle, Wifi, RotateCcw, Sun, Moon, Monitor } from 'lucide-react';
import { SIGNAL_DEFINITIONS } from '@/data/mockData';
import { PageTransition } from '@/components/AnimatedComponents';
import { toast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';

const defaultWeights = [18, 15, 12, 13, 14, 8, 10, 10];
const defaultThresholds = { BLOCKED: 15, RESTRICTED: 35, WARNING: 55, CAUTION: 75 };

const Settings: React.FC = () => {
  const [weights, setWeights] = useState(defaultWeights);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [alertToggles, setAlertToggles] = useState<Record<string, boolean>>({
    'Score Drop': true, 'Credit Frozen': true, 'Velocity Spike': true, 'Chargeback Phase': true, 'Legal Hold': true,
  });
  const [escalationEmail, setEscalationEmail] = useState('risk-team@tbo.com');
  const [tenurePeriod, setTenurePeriod] = useState(90);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { mode: themeMode, setMode: setThemeMode, isDark } = useTheme();

  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const updateWeight = (index: number, val: number) => {
    const next = [...weights];
    next[index] = val;
    setWeights(next);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (totalWeight !== 100) {
      toast({ title: 'Invalid Weights', description: `Signal weights must sum to 100%. Currently: ${totalWeight}%`, variant: 'destructive' });
      return;
    }
    // Validate thresholds are in order
    if (thresholds.BLOCKED >= thresholds.RESTRICTED || thresholds.RESTRICTED >= thresholds.WARNING || thresholds.WARNING >= thresholds.CAUTION) {
      toast({ title: 'Invalid Thresholds', description: 'Band thresholds must be in ascending order: BLOCKED < RESTRICTED < WARNING < CAUTION', variant: 'destructive' });
      return;
    }
    setSaved(true);
    setHasChanges(false);
    toast({ title: 'Configuration Saved', description: 'All settings have been saved successfully. Changes will take effect on the next scoring cycle.' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setWeights(defaultWeights);
    setThresholds(defaultThresholds);
    setTenurePeriod(90);
    setEscalationEmail('risk-team@tbo.com');
    setAlertToggles({ 'Score Drop': true, 'Credit Frozen': true, 'Velocity Spike': true, 'Chargeback Phase': true, 'Legal Hold': true });
    setHasChanges(false);
    toast({ title: 'Reset to Defaults', description: 'All settings have been restored to their default values.' });
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        {/* Signal Weights */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Signal Weights</h3>
            <span className={`font-mono text-xs font-semibold ${totalWeight === 100 ? 'text-band-clear' : 'text-destructive'}`}>Total: {totalWeight}%</span>
          </div>
          <div className="space-y-3">
            {SIGNAL_DEFINITIONS.map((def, i) => (
              <div key={def.id} className="flex items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground w-8">{def.id}</span>
                <span className="text-xs text-foreground w-40">{def.name}</span>
                <input type="range" min="0" max="40" value={weights[i]} onChange={e => updateWeight(i, Number(e.target.value))} className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm" />
                <span className="font-mono text-xs text-foreground font-semibold w-10 text-right">{weights[i]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Band Thresholds */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Decision Band Thresholds</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(thresholds) as (keyof typeof thresholds)[]).map(band => (
              <div key={band} className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{band} ≤</label>
                <input type="number" value={thresholds[band]} onChange={e => { setThresholds({ ...thresholds, [band]: Number(e.target.value) }); setHasChanges(true); }} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">CLEAR = scores above {thresholds.CAUTION}</p>
        </div>

        {/* Alert Configuration */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Alert Configuration</h3>
          <div className="space-y-2 mb-5">
            {Object.keys(alertToggles).map(type => (
              <div key={type} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{type}</span>
                <button onClick={() => { setAlertToggles({ ...alertToggles, [type]: !alertToggles[type] }); setHasChanges(true); }} className={`w-10 h-[22px] rounded-full transition-colors relative ${alertToggles[type] ? 'bg-primary' : 'bg-secondary'}`}>
                  <span className={`absolute top-[3px] w-4 h-4 rounded-full transition-transform shadow-sm ${alertToggles[type] ? 'left-[22px] bg-primary-foreground' : 'left-[3px] bg-muted-foreground'}`} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Escalation Email</label>
            <input value={escalationEmail} onChange={e => { setEscalationEmail(e.target.value); setHasChanges(true); }} className="w-full max-w-sm bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
          </div>
        </div>

        {/* Tenure Period */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">New Agency Tenure Period</h3>
          <div className="flex items-center gap-3">
            <input type="number" value={tenurePeriod} onChange={e => { setTenurePeriod(Number(e.target.value)); setHasChanges(true); }} className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40" />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Appearance */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">Appearance</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Choose your preferred theme. System mode follows your OS preference.</p>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setThemeMode(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  themeMode === opt.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Status */}
        <div className="panel p-6">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5">API Connection Status</h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-band-clear pulse-live" />
              <span className="text-sm text-foreground font-medium">TBO Staging API</span>
              <Wifi className="w-3.5 h-3.5 text-band-clear" />
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Last successful poll: </span>
              <span className="font-mono text-foreground font-semibold">2 min ago</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Events pulled (last cycle): </span>
              <span className="font-mono text-foreground font-semibold">142</span>
            </div>
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className={`bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm ${!hasChanges && !saved ? 'opacity-60' : ''}`}>
            Save Configuration
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm hover:bg-secondary/80 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          {saved && <span className="flex items-center gap-1 text-band-clear text-xs font-medium"><CheckCircle className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;

import React, { useState } from 'react';
import { CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { SIGNAL_DEFINITIONS } from '@/data/mockData';
import { PageTransition } from '@/components/AnimatedComponents';

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

  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const updateWeight = (index: number, val: number) => {
    const next = [...weights];
    next[index] = val;
    setWeights(next);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageTransition>
      <div className="space-y-8 max-w-4xl">
        {/* Signal Weights */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm tracking-wider text-muted-foreground">Signal Weights</h3>
            <span className={`font-mono text-xs ${totalWeight === 100 ? 'text-band-clear' : 'text-destructive'}`}>Total: {totalWeight}%</span>
          </div>
          <div className="space-y-3">
            {SIGNAL_DEFINITIONS.map((def, i) => (
              <div key={def.id} className="flex items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground w-8">{def.id}</span>
                <span className="text-xs text-foreground w-40">{def.name}</span>
                <input type="range" min="0" max="40" value={weights[i]} onChange={e => updateWeight(i, Number(e.target.value))} className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                <span className="font-mono text-xs text-foreground w-10 text-right">{weights[i]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Band Thresholds */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Decision Band Thresholds</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(thresholds) as (keyof typeof thresholds)[]).map(band => (
              <div key={band} className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{band} ≤</label>
                <input type="number" value={thresholds[band]} onChange={e => setThresholds({ ...thresholds, [band]: Number(e.target.value) })} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">CLEAR = scores above {thresholds.CAUTION}</p>
        </div>

        {/* Alert Configuration */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">Alert Configuration</h3>
          <div className="space-y-2 mb-4">
            {Object.keys(alertToggles).map(type => (
              <div key={type} className="flex items-center justify-between py-1">
                <span className="text-xs text-foreground">{type}</span>
                <button onClick={() => setAlertToggles({ ...alertToggles, [type]: !alertToggles[type] })} className={`w-10 h-5 rounded-full transition-colors relative ${alertToggles[type] ? 'bg-primary' : 'bg-secondary'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${alertToggles[type] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Escalation Email</label>
            <input value={escalationEmail} onChange={e => setEscalationEmail(e.target.value)} className="w-full max-w-sm bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Tenure Period */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">New Agency Tenure Period</h3>
          <div className="flex items-center gap-3">
            <input type="number" value={tenurePeriod} onChange={e => setTenurePeriod(Number(e.target.value))} className="w-24 bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>

        {/* API Status */}
        <div className="panel p-5">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4">API Connection Status</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-band-clear pulse-live" />
              <span className="text-xs text-foreground">TBO Staging API</span>
              <Wifi className="w-3.5 h-3.5 text-band-clear" />
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Last successful poll: </span>
              <span className="font-mono text-foreground">2 min ago</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Events pulled (last cycle): </span>
              <span className="font-mono text-foreground">142</span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Save Configuration</button>
          {saved && <span className="flex items-center gap-1 text-band-clear text-xs"><CheckCircle className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceArea, ReferenceLine, CartesianGrid,
} from 'recharts';
import { Shield, Zap, Search, ChevronRight, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import {
    AGENCIES, SYSTEM_PROMPT, SIGNAL_NAMES, SIGNAL_FULL_NAMES,
    INJECT_EVENTS, EVENT_DESCRIPTIONS,
    getBandColor, getScoreColor, getSignalColor, interpolateScores,
    type AgencyData, type Snapshot,
} from '@/data/reasoningDemoData';
import { AnimatedScore, PageTransition } from '@/components/AnimatedComponents';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getBandClass } from '@/lib/utils';

// ═══ CUSTOM CHART DOT ═══
function SnapshotDot({ cx, cy, payload, snapshots, selected, onSelect }: any) {
    const snap = snapshots.find((s: any) => s.day === payload.day);
    if (!snap) return null;
    const isSelected = selected?.day === payload.day;
    return (
        <g onClick={() => onSelect(snap)} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={isSelected ? 9 : 6} fill={getBandColor(snap.decision)}
                stroke={isSelected ? 'hsl(var(--accent))' : 'none'} strokeWidth={isSelected ? 3 : 0}
                opacity={isSelected ? 1 : 0.85}>
                {!isSelected && <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />}
            </circle>
        </g>
    );
}

// ═══ TIMELINE VIEW ═══
function TimelineView({ agency, selectedSnap, onSelectSnap }: {
    agency: AgencyData; selectedSnap: Snapshot | null; onSelectSnap: (s: Snapshot | null) => void;
}) {
    const data = interpolateScores(agency.snapshots);
    const bands = [
        { y1: 0, y2: 15, fill: '#E05C5C' },
        { y1: 16, y2: 35, fill: '#E8833A' },
        { y1: 36, y2: 55, fill: '#E8C23A' },
        { y1: 56, y2: 75, fill: '#4CAF82' },
        { y1: 76, y2: 100, fill: '#4CAF82' },
    ];

    if (selectedSnap) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 border-b border-border pb-4">
                    <button
                        onClick={() => onSelectSnap(null)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-heading tracking-wider uppercase bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Timeline View
                    </button>
                    <div>
                        <h2 className="font-heading text-lg tracking-wider text-foreground">Deep Dive: Day {selectedSnap.day}</h2>
                        <p className="text-xs font-mono text-muted-foreground">Analysing event for {agency.name}</p>
                    </div>
                </div>
                <SnapshotDetail agency={agency} snap={selectedSnap} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-[500px]">
                <div className="lg:col-span-8 panel-glass p-6 flex flex-col h-full">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4 uppercase">Trust Score Timeline — Last 30 Days</h3>

                    {/* Narrative bar */}
                    <div className="text-sm font-mono text-accent text-center p-3 border border-border rounded-lg bg-accent/5 mb-4 shrink-0">
                        <span className="font-bold">SYSTEM INSIGHT:</span> {agency.narrative_bar}
                    </div>

                    <div className="flex-1 w-full relative min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 30, right: 20, bottom: 5, left: -20 }}>
                                {bands.map((b, i) => (
                                    <ReferenceArea key={i} y1={b.y1} y2={b.y2} fill={b.fill} fillOpacity={0.03} />
                                ))}
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }}
                                    axisLine={{ stroke: 'hsl(var(--chart-axis))' }} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--chart-tick))', fontSize: 10 }}
                                    axisLine={false} tickLine={false} ticks={[0, 15, 35, 55, 75, 100]} />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                                    formatter={(v: any) => [`${v} pts`, 'Trust Score']}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: 4 }}
                                />
                                {agency.event_markers.map((m, i) => (
                                    <ReferenceLine key={i} x={m.day} stroke="hsl(var(--destructive))" strokeDasharray="4 4"
                                        label={{ value: m.label, position: 'top', fill: 'hsl(var(--destructive))', fontSize: 10, fontWeight: 'bold' }} />
                                ))}
                                <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} activeDot={false} />
                                <Line type="monotone" dataKey="score" stroke="transparent" strokeWidth={0}
                                    dot={(props: any) => <SnapshotDot {...props} snapshots={agency.snapshots} selected={selectedSnap} onSelect={onSelectSnap} />}
                                    activeDot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 panel-glass p-6 flex flex-col h-full">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4 uppercase">Event History Log</h3>
                    <div className="flex-1 overflow-y-auto outline-none pr-2 space-y-3 custom-scrollbar">
                        {agency.snapshots.slice().reverse().map(snap => (
                            <div key={snap.day}
                                className={`p-3 rounded-lg border transition-all cursor-pointer hover-lift ${selectedSnap?.day === snap.day ? 'border-accent bg-accent/10 shadow-sm' : 'border-border bg-card/50 hover:border-accent/40 hover:bg-card'}`}
                                onClick={() => onSelectSnap(snap)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-[10px] border ${selectedSnap?.day === snap.day ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-secondary text-foreground border-border'}`}>
                                            D{snap.day}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-heading text-[11px] uppercase tracking-wider" style={{ color: getScoreColor(snap.trust_score) }}>Score {snap.trust_score}</span>
                                        </div>
                                    </div>
                                    <div className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border uppercase tracking-wider" style={{ color: getBandColor(snap.decision), borderColor: `${getBandColor(snap.decision)}40`, background: `${getBandColor(snap.decision)}10` }}>
                                        {snap.decision}
                                    </div>
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground line-clamp-3 leading-relaxed" title={snap.headline}>
                                    {snap.headline}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ SNAPSHOT DETAIL ═══
function SnapshotDetail({ agency, snap }: { agency: AgencyData; snap: Snapshot }) {
    const signals = agency.weightProfile.signals;
    const trajectoryIcon: Record<string, string> = { IMPROVING: '↑', STABLE: '→', DETERIORATING: '↓', COLLAPSED: '↘' };
    const trajectoryColor: Record<string, string> = { IMPROVING: 'text-[hsl(var(--band-clear))]', STABLE: 'text-muted-foreground', DETERIORATING: 'text-[hsl(var(--band-restricted))]', COLLAPSED: 'text-destructive' };
    const tColorClass = trajectoryColor[snap.trajectory] || 'text-muted-foreground';

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* LEFT — Weight Profile */}
            <div className="panel-glass p-6">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5 uppercase">Learned Signal Weights</h3>
                <div className="space-y-3">
                    {Object.entries(signals).map(([id, sig]) => {
                        const deviation = Math.abs(sig.current - sig.prior);
                        const isDeviated = deviation > 0.05;
                        return (
                            <div key={id} className="group relative" title={sig.note}>
                                <div className="flex justify-between items-center mb-1.5 text-xs">
                                    <span className={`font-mono ${isDeviated ? 'text-accent font-semibold' : 'text-muted-foreground'}`}>{id} {SIGNAL_NAMES[id]}</span>
                                    <span className={`font-mono ${isDeviated ? 'text-accent font-bold' : 'text-foreground'}`}>{sig.current.toFixed(2)}</span>
                                </div>
                                <div className="h-1.5 bg-background rounded-full relative overflow-hidden">
                                    <div className="absolute h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${sig.prior * 200}%` }} />
                                    <div className={`absolute h-full rounded-full transition-all duration-700 ${sig.current > sig.prior ? 'bg-accent' : sig.current < sig.prior ? 'bg-muted-foreground' : 'bg-primary'}`}
                                        style={{ width: `${sig.current * 200}%` }} />
                                </div>
                                <div className={`text-[10px] font-mono mt-1 text-right ${isDeviated ? (sig.current > sig.prior ? 'text-accent' : 'text-muted-foreground') : 'text-muted-foreground/60'}`}>
                                    {sig.prior.toFixed(2)} → {sig.current.toFixed(2)} {sig.current > sig.prior ? '↑' : sig.current < sig.prior ? '↓' : ''}
                                    <span className="ml-2 text-muted-foreground/50">F1:{sig.reliability.toFixed(2)} TP:{sig.tp} FP:{sig.fp}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CENTER — Investigation */}
            <div className="panel-glass p-6">
                <div className="flex items-center gap-2 mb-5">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground uppercase">Investigation • Day {snap.day}</h3>
                    {snap.cewe_phase && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${snap.cewe_phase.includes('3') ? 'bg-destructive/10 text-destructive' : snap.cewe_phase.includes('2') ? 'bg-[hsl(var(--band-restricted))]/10 text-[hsl(var(--band-restricted))]' : 'bg-accent/10 text-accent'}`}>
                            {snap.cewe_phase}
                        </span>
                    )}
                </div>

                <div className="flex items-end gap-6 mb-6">
                    <div>
                        <div className={`text-3xl font-bold flex items-center gap-2 ${tColorClass}`}>
                            <span>{trajectoryIcon[snap.trajectory]}</span>
                            <span className="font-heading uppercase text-xl">{snap.trajectory}</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 pb-1">
                        <span className="text-2xl font-mono text-muted-foreground/60">{snap.previous_score}</span>
                        <span className="text-muted-foreground text-sm">→</span>
                        <span className="font-mono text-4xl font-bold" style={{ color: getScoreColor(snap.trust_score) }}>
                            <AnimatedScore value={snap.trust_score} />
                        </span>
                    </div>
                </div>

                {snap.hypotheses && snap.hypotheses.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {snap.hypotheses.map((h, i) => (
                            <div key={i} className="p-3 bg-secondary/30 rounded-lg border border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-heading text-sm text-foreground">{h.name}</span>
                                    <span className="font-mono text-xs font-bold" style={{ color: h.probability > 50 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))' }}>{h.probability}%</span>
                                </div>
                                <div className="h-1.5 bg-background rounded-full overflow-hidden mb-3">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${h.probability}%`, background: h.probability > 50 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))' }} />
                                </div>
                                <div className="space-y-1">
                                    {h.supporting.slice(0, 2).map((s, j) => <div key={j} className="text-[10px] text-[hsl(var(--band-clear))] flex gap-1.5"><span className="font-bold">+</span> {s}</div>)}
                                    {h.against.slice(0, 1).map((s, j) => <div key={j} className="text-[10px] text-destructive flex gap-1.5"><span className="font-bold">−</span> {s}</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 bg-accent/5 border-l-4 border-accent rounded-r-lg font-mono text-xs leading-relaxed text-foreground mb-6">
                    {snap.headline}
                </div>

                {/* Signal Readings Heatmap lines */}
                <div>
                    <h4 className="font-heading text-[11px] tracking-wider text-muted-foreground mb-3">ACTIVE SIGNAL READINGS</h4>
                    <div className="space-y-2">
                        {Object.entries(snap.active_signals).map(([id, val]) => (
                            <div key={id} className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-muted-foreground w-6">{id}</span>
                                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val * 100}%`, background: getSignalColor(val) }} />
                                </div>
                                <span className="font-mono text-[10px] font-bold w-8 text-right" style={{ color: getSignalColor(val) }}>{val.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT — Decision */}
            <div className="panel-glass p-6">
                <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-5 uppercase">Decision & Action</h3>

                <div className="w-full py-4 rounded-xl text-center mb-4 transition-colors font-heading text-2xl tracking-widest uppercase border-2 shadow-sm"
                    style={{
                        background: `${getBandColor(snap.decision)}10`,
                        color: getBandColor(snap.decision),
                        borderColor: `${getBandColor(snap.decision)}40`
                    }}>
                    {snap.decision}
                </div>

                <div className={`w-full py-2 rounded-lg text-center font-mono text-xs font-bold mb-6 border ${snap.autonomous ? 'bg-[hsl(var(--band-clear))]/10 text-[hsl(var(--band-clear))] border-[hsl(var(--band-clear))]/30' : 'bg-accent/10 text-accent border-accent/30'}`}>
                    {snap.autonomous ? '✓ ACTING AUTONOMOUSLY' : '⚠ ESCALATING TO ANALYST'}
                </div>

                {snap.analyst_question && (
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/30 mb-6">
                        <h4 className="font-heading text-[11px] text-accent tracking-widest mb-2 uppercase">Analyst Query</h4>
                        <p className="font-mono text-xs text-foreground leading-relaxed">
                            {snap.analyst_question}
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center py-3 border-y border-border mb-6">
                    <span className="font-heading text-xs text-muted-foreground tracking-wider uppercase">Confidence Level</span>
                    <span className="font-heading text-sm font-bold uppercase" style={{
                        color: snap.confidence === 'HIGH' ? 'hsl(var(--band-clear))' : snap.confidence === 'MEDIUM' ? 'hsl(var(--band-warning))' : 'hsl(var(--band-restricted))'
                    }}>{snap.confidence}</span>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-2 text-sm">
                        <span className="text-xl">💡</span>
                        <div>
                            <span className="font-bold text-foreground block mb-1">Key Insight</span>
                            <span className="text-muted-foreground text-xs leading-relaxed">{snap.key_insight}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ LIVE INVESTIGATION ═══
function LiveInvestigation({ agency }: { agency: AgencyData }) {
    const [eventType, setEventType] = useState('velocity_spike');
    const [severity, setSeverity] = useState(0.7);
    const [customInput, setCustomInput] = useState('');
    const [mode, setMode] = useState('standard');
    const [output, setOutput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const streamRef = useRef<HTMLDivElement>(null);

    const runInvestigation = useCallback(async () => {
        setIsStreaming(true);
        setIsComplete(false);
        setOutput('');
        const snap = agency.snapshots[agency.snapshots.length - 1];
        const wp = agency.weightProfile;

        // Build weights payload
        const weights: Record<string, any> = {};
        for (const [id, s] of Object.entries(wp.signals)) {
            weights[id] = { current: s.current, prior: s.prior, reliability: s.reliability, tp: s.tp, fp: s.fp, tn: s.tn, fn: s.fn };
        }

        const payload = {
            agency_name: agency.name,
            agency_id: agency.id,
            cohort: agency.cohort,
            tenure_days: agency.tenure_days,
            credit_limit: agency.credit_limit,
            outstanding_balance: agency.outstanding_balance,
            credit_utilization: agency.credit_utilization,
            trust_score: snap.trust_score,
            previous_score: snap.previous_score,
            event_type: eventType,
            severity,
            custom_input: customInput || null,
            mode,
            signals: snap.active_signals,
            weights,
            total_observations: wp.total_observations,
            learning_rate: wp.learning_rate,
        };

        try {
            const resp = await fetch(`${API_BASE}/api/investigate/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ detail: 'Unknown error' }));
                setOutput(`Error: ${err.detail || 'Failed to connect to investigation engine'}`);
                setIsStreaming(false);
                return;
            }

            const reader = resp.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                setOutput(prev => prev + parsed.text);
                                if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
                            }
                        } catch { /* skip */ }
                    }
                }
            }
        } catch (e: any) {
            setOutput(prev => prev + `\n\nError: ${e.message}`);
        }
        setIsStreaming(false);
        setIsComplete(true);
    }, [agency, eventType, severity, customInput, mode]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {/* CONTROLS */}
            <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="panel-glass p-6">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4 uppercase">Inject Signal Event</h3>
                    <select
                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none mb-4"
                        value={eventType}
                        onChange={e => setEventType(e.target.value)}
                    >
                        {INJECT_EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        <option value="custom">Custom Manual Input...</option>
                    </select>

                    {eventType === 'custom' ? (
                        <textarea
                            className="w-full h-24 bg-background border border-border text-foreground text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none mb-2 custom-scrollbar"
                            placeholder="Type new raw evidence here (e.g. 'Agency just attempted to book 50 non-refundable rooms in Dubai...')"
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-2 mb-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-heading tracking-wider text-muted-foreground uppercase">Severity</span>
                                <span className="font-mono font-bold text-accent">{severity.toFixed(1)}</span>
                            </div>
                            <input type="range" className="w-full accent-accent" min="0.1" max="1" step="0.1" value={severity}
                                onChange={e => setSeverity(parseFloat(e.target.value))} />
                        </div>
                    )}
                </div>

                <div className="panel-glass p-6">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4 uppercase">Reasoning Mode</h3>
                    <div className="space-y-3">
                        {[['standard', 'Standard Analysis'], ['deep', 'Deep Investigation'], ['stress', 'Stress Test (5th occurence)']].map(([v, l]) => (
                            <label key={v} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === v ? 'border-accent bg-accent/5' : 'border-border bg-card/50 hover:bg-secondary/50'}`}>
                                <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="accent-accent scale-110" />
                                <span className={`text-sm ${mode === v ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{l}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="panel-glass p-6 flex-1 mb-5">
                    <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-4 uppercase">Weight Profile Context</h3>
                    <div className="space-y-2">
                        {Object.entries(agency.weightProfile.signals).map(([id, sig]) => (
                            <div key={id} className="text-xs">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-muted-foreground">{id}</span>
                                    <span className="font-mono font-bold text-foreground">{sig.current.toFixed(2)}</span>
                                </div>
                                <div className="h-1 bg-background rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${sig.current > sig.prior + 0.05 ? 'bg-accent' : sig.current < sig.prior - 0.05 ? 'bg-muted-foreground' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(sig.current * 200, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* STREAM OUTPUT */}
            <div className="lg:col-span-8 flex flex-col h-full panel-glass overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-accent" />
                        <h2 className="font-heading text-lg tracking-wider text-foreground">Live Inference Stream</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all press-scale ${isStreaming ? 'bg-accent/80 text-background animate-pulse cursor-wait' : 'bg-accent text-background hover:bg-accent/90'}`}
                            disabled={isStreaming}
                            onClick={runInvestigation}
                        >
                            {isStreaming ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    Investigating...
                                </>
                            ) : (
                                <>Run Investigation</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#0E1318] text-[#E8EDF2]" ref={streamRef}>
                    {output ? (
                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words pb-4">
                            <ReactMarkdown
                                components={{
                                    strong: ({ node, ...props }) => <span className="text-accent font-bold" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-4 text-[#E8EDF2]/90" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-[15px] font-bold text-white mt-6 mb-2 uppercase tracking-widest border-b border-[#1E2A36] pb-1" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-white mt-5 mb-2 uppercase tracking-wider" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-4 mb-2" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-none pl-2 mb-4 space-y-2 border-l-2 border-[#1E2A36]" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                                }}
                            >
                                {output}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                            <span className="text-[#5A7A8A]">
                                {'> Ready. Select an event and click Run Investigation.\n> The AI will act as the RiskSense Engine and process the event using ' + agency.name + "'s specific weight profile (" + agency.weightProfile.total_observations + " prior observations)."}
                            </span>
                        </pre>
                    )}
                    {isStreaming && <span className="inline-block w-2.5 h-4 ml-1 bg-accent animate-pulse align-middle" />}
                    {isComplete && <div className="text-[#4CAF82] font-bold mt-6 pt-4 border-t border-[#1E2A36]">▸ INVESTIGATION COMPLETE</div>}
                </div>
            </div>
        </div>
    );
}

// ═══ HYPOTHESIS ARENA ═══
function HypothesisArena() {
    const [useEvolved, setUseEvolved] = useState(true);
    const tm = AGENCIES[2]; // TravelMate
    const sk = AGENCIES[4]; // SkyTravel
    const tmSnap = tm.snapshots[1]; // Day 10, score 41
    const skSnap = sk.snapshots[0]; // Day 7, score 58 → adjusted to 41 for arena

    const tmWeights = useEvolved ? tm.weightProfile.signals : Object.fromEntries(Object.entries(tm.weightProfile.signals).map(([k, v]) => [k, { ...v, current: v.prior }]));
    const skWeights = useEvolved ? sk.weightProfile.signals : Object.fromEntries(Object.entries(sk.weightProfile.signals).map(([k, v]) => [k, { ...v, current: v.prior }]));

    const renderCol = (agency: AgencyData, snap: Snapshot, weights: any, day: number) => {
        const decision = useEvolved ? (agency === tm ? 'RESTRICTED' : 'CAUTION') : 'WARNING';
        const confidence = useEvolved ? (agency === tm ? 'HIGH' : 'LOW') : 'MEDIUM';
        const trajectory = agency === tm ? '↓ DETERIORATING from 61' : '↓ DETERIORATING from 62';
        const tColor = 'text-[hsl(var(--band-restricted))]';
        const story = agency === tm
            ? '187-day agency. Invoice missed yesterday. S8 has been right 94% of the time for this agency. Trajectory worsening for 3 weeks.'
            : '94-day agency. Invoice paid early yesterday (counter-signal). Weights not yet fully evolved — 88 observations only. Phase 1 pattern emerging but individually explainable.';
        const action = agency === tm
            ? (useEvolved ? 'Credit reduced to 40%. Autonomous.' : 'Standard caution. No specific action.')
            : (useEvolved ? 'Watch only. No credit action. Analyst notified.' : 'Standard caution. No specific action.');

        const sortedSignals = Object.entries(snap.active_signals).sort(([, a], [, b]) => b - a);

        return (
            <div className="panel-glass p-8 flex flex-col h-full hover-lift">
                <div className="flex justify-between items-end border-b border-border pb-4 mb-6">
                    <div>
                        <h2 className="font-heading text-2xl text-foreground mb-1">{agency.name}</h2>
                        <span className="font-mono text-xs text-muted-foreground">Day {day}</span>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-3xl font-bold text-foreground">41</div>
                        <span className="text-[10px] font-heading tracking-widest text-muted-foreground uppercase">Trust Score</span>
                    </div>
                </div>

                <div className={`font-mono text-sm font-bold mb-8 ${tColor}`}>{trajectory}</div>

                <div className="mb-8">
                    <h4 className="font-heading text-xs tracking-wider text-muted-foreground uppercase mb-4">Weight Profile Evaluated</h4>
                    <div className="space-y-3">
                        {Object.entries(weights).filter(([, w]: any) => w.current > 0.06).sort(([, a]: any, [, b]: any) => b.current - a.current)
                            .slice(0, 4).map(([id, w]: any) => (
                                <div key={id} className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] text-muted-foreground w-20 truncate">{id} {SIGNAL_NAMES[id]}</span>
                                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                        <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${w.current * 200}%` }} />
                                    </div>
                                    <span className="font-mono text-xs font-bold text-accent w-10 text-right">{w.current.toFixed(2)}</span>
                                </div>
                            ))}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground mt-3 italic bg-secondary/30 p-2 rounded-md">
                        {useEvolved
                            ? (agency === tm ? `S8 earned weight 0.42 vs prior 0.14 through ${agency.weightProfile.total_observations} observations` : `Learning rate ${agency.weightProfile.learning_rate} — weights still close to prior`)
                            : 'Platform prior weights — identical for all agencies'}
                    </p>
                </div>

                <div className="mb-8">
                    <h4 className="font-heading text-xs tracking-wider text-muted-foreground uppercase mb-4">Active Signal Readings</h4>
                    <div className="space-y-2">
                        {sortedSignals.filter(([, v]) => v > 0.1).slice(0, 5).map(([id, val]) => (
                            <div key={id} className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-foreground font-bold w-6">{id}</span>
                                <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val * 100}%`, background: getSignalColor(val) }} />
                                </div>
                                <span className="font-mono text-[10px] font-bold w-8 text-right" style={{ color: getSignalColor(val) }}>{val.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="text-sm font-mono leading-relaxed bg-accent/5 border-l-2 border-accent p-3 mb-6 text-foreground">
                        {story}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <span className="font-heading text-[11px] tracking-wider text-muted-foreground uppercase">AI Decision</span>
                        <div className="font-heading text-xl uppercase tracking-widest px-4 py-1 rounded-md border text-center"
                            style={{ background: `${getBandColor(decision)}15`, color: getBandColor(decision), borderColor: `${getBandColor(decision)}40` }}>
                            {decision}
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-border mt-3 text-xs">
                        <span className="font-heading tracking-wider text-muted-foreground uppercase">Confidence</span>
                        <span className="font-heading font-bold uppercase" style={{ color: confidence === 'HIGH' ? 'hsl(var(--band-clear))' : confidence === 'LOW' ? 'hsl(var(--band-restricted))' : 'hsl(var(--band-warning))' }}>{confidence}</span>
                    </div>

                    <p className="text-[11px] font-mono text-muted-foreground text-center mt-3 pt-3 border-t border-border">{action}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto py-4">
            <div className="text-center mb-8">
                <h2 className="font-heading text-3xl text-foreground tracking-wide mb-2">Hypothesis Arena</h2>
                <p className="text-muted-foreground font-mono text-sm max-w-lg mx-auto">Same score. Different story. Different action. Compare how the AI treats two agencies based on what it has learned.</p>

                <div className="mt-8 mb-4">
                    <span className="text-7xl font-mono font-bold text-accent"><AnimatedScore value={41} /></span>
                    <p className="text-xs font-heading tracking-widest uppercase text-muted-foreground mt-2">Both Agencies Score 41 Today</p>
                </div>

                <div className="inline-flex bg-secondary p-1 rounded-xl mt-4">
                    <button
                        className={`px-6 py-2 rounded-lg text-sm font-heading tracking-wider uppercase transition-all ${useEvolved ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setUseEvolved(true)}
                    >
                        Evolved Weights
                    </button>
                    <button
                        className={`px-6 py-2 rounded-lg text-sm font-heading tracking-wider uppercase transition-all ${!useEvolved ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setUseEvolved(false)}
                    >
                        Fixed Prior Weights
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
                {renderCol(tm, tmSnap, tmWeights, 10)}
                {renderCol(sk, skSnap, skSnap.active_signals as any, 7)}
            </div>

            <div className="mt-8 panel-glass p-5 text-center text-sm text-foreground max-w-3xl mx-auto shadow-xl border-accent/20">
                <span className="text-accent font-bold mr-2">Insight:</span>
                {useEvolved
                    ? 'A system with fixed weights treats these agencies identically. RiskSense AI recommends RESTRICT for one and CAUTION for the other. The difference is not the score. It is what the system has learned about each agency over time.'
                    : 'Fixed weights: both get the same treatment — WARNING with MEDIUM confidence. No differentiation. No personalisation. The same number produces the same generic response.'}
            </div>
        </div>
    );
}

// ═══ MAIN APP ═══
// ═══ MAIN APP ═══
export default function ReasoningDemo() {
    const [selectedAgency, setSelectedAgency] = useState<AgencyData | null>(null);
    const [selectedSnap, setSelectedSnap] = useState<Snapshot | null>(null);

    useEffect(() => { setSelectedSnap(null); }, [selectedAgency]);

    return (
        <PageTransition>
            <div className="space-y-5 -m-4 md:-m-6 p-4 md:p-6 overflow-auto h-[calc(100vh-5rem)] custom-scrollbar">
                {/* Header Strip */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shadow-sm border border-accent/20">
                            <Shield className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl tracking-wider text-foreground">RiskSense AI Engine</h1>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5"><span className="text-accent italic">Trust is a story, not a score.</span> • B2B Reasoning Demo</p>
                        </div>
                    </div>
                </div>

                {!selectedAgency ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <h2 className="font-heading text-xl tracking-wider text-foreground uppercase">Select Agency Scenario</h2>
                            <p className="font-mono text-sm text-muted-foreground mt-1">Choose an agency profile to explore the AI's reasoning, timeline, and stress-test behavior.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {AGENCIES.map(a => (
                                <div key={a.id}
                                    className="kpi-card !p-5 cursor-pointer transition-all border-l-4 hover:-translate-y-1 hover:shadow-lg border-border/50 hover:border-r hover:border-t hover:border-b hover:border-r-accent/30 hover:border-t-accent/30 hover:border-b-accent/30 bg-card/50 hover:bg-card group"
                                    style={{ borderLeftColor: getBandColor(a.band) }}
                                    onClick={() => setSelectedAgency(a)}>

                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-mono text-[11px] text-muted-foreground mb-1 group-hover:text-accent/80 transition-colors">{a.id}</div>
                                            <div className="font-heading text-lg text-foreground tracking-wide leading-tight">{a.name}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-mono text-3xl font-bold leading-none mb-1.5" style={{ color: getScoreColor(a.trust_score) }}>
                                                {a.trust_score}
                                            </div>
                                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase" style={{
                                                background: `${getBandColor(a.band)}15`, color: getBandColor(a.band), borderColor: `${getBandColor(a.band)}40`
                                            }}>{a.band}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 min-h-[54px] mb-4">{a.tagline}</p>

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-heading tracking-widest text-muted-foreground uppercase">Suspicion Level</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className={`w-2 h-2 rounded-full ${i <= a.suspicion ? 'bg-destructive shadow-[0_0_5px_rgba(224,92,92,0.4)]' : 'bg-muted border border-border'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {a.tenure_days} days tenure
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-[calc(100%-5rem)] min-h-[700px] animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Selected Agency Header */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                            <button
                                onClick={() => setSelectedAgency(null)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-heading tracking-wider uppercase bg-secondary text-foreground hover:bg-secondary/80 transition-colors shrink-0"
                            >
                                <ChevronRight className="w-4 h-4" /> Back to Agencies
                            </button>
                            <div className="h-8 w-px bg-border mx-2"></div>
                            <div className="flex items-center justify-between flex-1">
                                <div className="flex items-center gap-4">
                                    <h2 className="font-heading text-xl text-foreground tracking-wide">{selectedAgency.name}</h2>
                                    <div className="flex gap-2">
                                        <span className="font-mono text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">{selectedAgency.id}</span>
                                        <span className="font-mono text-xs font-bold px-2 py-1 rounded border uppercase" style={{ background: `${getBandColor(selectedAgency.band)}15`, color: getBandColor(selectedAgency.band), borderColor: `${getBandColor(selectedAgency.band)}40` }}>
                                            {selectedAgency.band}
                                        </span>
                                    </div>
                                </div>
                                <div className="font-mono text-2xl font-bold" style={{ color: getScoreColor(selectedAgency.trust_score) }}>
                                    Score: {selectedAgency.trust_score}
                                </div>
                            </div>
                        </div>

                        {/* MAIN CONTENT PORTAL */}
                        <div className="panel-glass flex flex-col overflow-hidden flex-1">
                            <Tabs defaultValue="timeline" className="flex flex-col h-full w-full">
                                <div className="px-6 pt-5 border-b border-border/50 bg-secondary/10 shrink-0">
                                    <TabsList className="bg-transparent space-x-6 p-0 h-auto w-full justify-start">
                                        <TabsTrigger value="timeline" className="font-heading text-sm tracking-widest uppercase border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent rounded-none px-2 py-3 data-[state=active]:shadow-none">
                                            Timeline View
                                        </TabsTrigger>
                                        <TabsTrigger value="live" className="font-heading text-sm tracking-widest uppercase border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent rounded-none px-2 py-3 data-[state=active]:shadow-none">
                                            Live Investigation
                                        </TabsTrigger>
                                        <TabsTrigger value="arena" className="font-heading text-sm tracking-widest uppercase border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent rounded-none px-2 py-3 data-[state=active]:shadow-none">
                                            Hypothesis Arena
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-card/50 custom-scrollbar">
                                    <TabsContent value="timeline" className="h-full m-0 data-[state=inactive]:hidden">
                                        <TimelineView agency={selectedAgency} selectedSnap={selectedSnap} onSelectSnap={setSelectedSnap} />
                                    </TabsContent>
                                    <TabsContent value="live" className="h-full m-0 data-[state=inactive]:hidden">
                                        <LiveInvestigation agency={selectedAgency} />
                                    </TabsContent>
                                    <TabsContent value="arena" className="h-full m-0 data-[state=inactive]:hidden">
                                        <HypothesisArena />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}

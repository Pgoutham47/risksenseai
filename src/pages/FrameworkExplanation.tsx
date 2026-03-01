import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Layers, Activity, ShieldCheck, ArrowRight, TrendingUp, History, Lock, UserX, CreditCard, Target, AlertTriangle, Scale, Code
} from 'lucide-react';

const tabs = [
    { id: 'core', label: 'Core Principles', icon: ShieldCheck },
    { id: 'containment', label: 'Containment Model', icon: Layers },
    { id: 'fraud', label: 'Fraud Types', icon: ShieldAlert },
    { id: 'signals', label: 'Signals & Logic', icon: Activity },
    { id: 'decay', label: 'Risk Decay', icon: History },
];

const FrameworkExplanation = () => {
    const [activeTab, setActiveTab] = useState('core');

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 overflow-x-hidden">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading tracking-tight mb-2 flex items-center gap-3">
                        <span className="bg-gradient-to-br from-gold to-gold-soft text-transparent bg-clip-text">
                            RiskSense AI
                        </span>
                        <span className="text-muted-foreground font-light text-2xl">—</span>
                        Decision Framework
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        A comprehensive guide to the reasoning model and codebase implementation. Discover how automated decisions are made proportionate, explainable, and reversible in the backend engine.
                    </p>
                </div>
            </div>

            {/* Interactive Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/50">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                relative flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors whitespace-nowrap
                ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
              `}
                        >
                            <tab.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                            <span>{tab.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Area */}
            <div className="relative min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                    >
                        {activeTab === 'core' && <CorePrinciplesTab />}
                        {activeTab === 'containment' && <ContainmentTab />}
                        {activeTab === 'fraud' && <FraudTypesTab />}
                        {activeTab === 'signals' && <SignalsTab />}
                        {activeTab === 'decay' && <RiskDecayTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// ======== Code Reference Component ========
const CodeRef = ({ title, file, desc }: { title: string, file: string, desc: React.ReactNode }) => (
    <div className="mt-6 border border-primary/20 bg-primary/5 rounded-lg p-4 font-mono text-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Code className="w-16 h-16 text-primary" />
        </div>
        <h5 className="font-semibold text-primary mb-1 flex items-center gap-2">
            <Code className="w-4 h-4" /> {title}
        </h5>
        <p className="text-muted-foreground text-xs mb-3">📍 File: <span className="text-foreground">{file}</span></p>
        <div className="text-foreground/80 leading-relaxed max-w-2xl">{desc}</div>
    </div>
);

// ======== Tab Components ======== 

const CorePrinciplesTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="panel-glass p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-12 -translate-y-12">
                <Scale className="w-64 h-64" />
            </div>
            <div className="relative z-10 max-w-3xl">
                <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-3">
                    <Target className="w-6 h-6 text-gold" />
                    The Governing Principle
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
                    <p>
                        <strong className="text-foreground font-medium">Risk is not binary.</strong> Fraud does not appear suddenly. Trust evolves over time and must be managed gradually.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 shrink-0" />
                            <span>A single anomalous session does not make an agency a fraudster.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 shrink-0" />
                            <span>A single late payment does not make an agency a defaulter.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 shrink-0" />
                            <span>A single velocity spike does not mean an account has been taken over.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <blockquote className="border-l-4 border-primary pl-6 py-2 my-8">
            <p className="text-xl italic text-foreground tracking-wide leading-relaxed">
                "We isolate risk before we generalise it. We contain it at the lowest possible level — session before user, user before agency. We act with confidence when evidence is strong and escalate honestly when it is not."
            </p>
        </blockquote>

        <CodeRef
            title="RiskOrchestrator Pipeline"
            file="backend/services/risk_orchestrator.py"
            desc={
                <div className="space-y-2">
                    <p>The core pipeline mapping this theory into action is governed by the <code>RiskOrchestrator.recompute_and_alert()</code> method. It executes sequentially in 8 steps:</p>
                    <ol className="list-decimal pl-5 space-y-1 text-xs text-foreground/70">
                        <li>Computes all 8 raw signals via <code>compute_all_signals()</code>.</li>
                        <li>Applies exponential Risk Decay based on half-lives.</li>
                        <li>Fetches Bayesian Personalised Weights using F1-reliability scores.</li>
                        <li>Computes the Bayesian Trust Score and applies tenure uncertainty premiums contextually.</li>
                        <li>Saves the rigorous, explainable Decision record.</li>
                        <li>Evaluates the dynamic Credit Ladder state (expansion or contraction).</li>
                        <li>Triggers multi-tiered Alerts for Human Analysts.</li>
                        <li>Updates agency outcome processors for continuous learning.</li>
                    </ol>
                </div>
            }
        />
    </div>
);

const ContainmentTab = () => (
    <div className="space-y-8 pb-10">
        <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-foreground">The Three-Level Containment Model</h2>
            <p className="text-muted-foreground">
                Most fraud systems ask: "Is this agency fraudulent?". We ask: "Where exactly is the anomaly — and what is the minimum intervention required to contain it?"
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <div className="panel p-6 border-l-4 border-l-blue-500 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="absolute right-0 top-0 opacity-5 -mt-4 -mr-4">
                    <Lock className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Level 1</h3>
                <h4 className="text-lg font-semibold text-foreground mb-4">Session Containment</h4>
                <p className="text-sm text-muted-foreground mb-6">Response time: Minutes</p>
                <ul className="text-sm space-y-2 text-foreground/80">
                    <li>• Lock specific suspicious session.</li>
                    <li>• Force re-authentication.</li>
                    <li>• Agency continues operating normally.</li>
                </ul>
            </div>

            <div className="panel p-6 border-l-4 border-l-amber-500 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="absolute right-0 top-0 opacity-5 -mt-4 -mr-4">
                    <UserX className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Level 2</h3>
                <h4 className="text-lg font-semibold text-foreground mb-4">User Containment</h4>
                <p className="text-sm text-muted-foreground mb-6">Response time: Hours</p>
                <ul className="text-sm space-y-2 text-foreground/80">
                    <li>• Freeze user's booking permissions.</li>
                    <li>• Notify agency ADMIN as a partner.</li>
                    <li>• Other users operate normally.</li>
                </ul>
            </div>

            <div className="panel p-6 border-l-4 border-l-destructive relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="absolute right-0 top-0 opacity-5 -mt-4 -mr-4">
                    <CreditCard className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-destructive mb-2">Level 3</h3>
                <h4 className="text-lg font-semibold text-foreground mb-4">Agency Credit Action</h4>
                <p className="text-sm text-muted-foreground mb-6">Response time: Days</p>
                <ul className="text-sm space-y-2 text-foreground/80">
                    <li>• Apply surgical credit controls.</li>
                    <li>• Begin formal investigation.</li>
                    <li>• Only if containment fails or exposure is high.</li>
                </ul>
            </div>
        </div>

        <div className="panel bg-primary/5 border-primary/20 p-6 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
                <h4 className="font-semibold text-primary mb-1">Escalation Principle</h4>
                <p className="text-sm text-foreground/80">
                    The agency is notified as a partner before they are restricted as a suspect. A platform that detects Phase 1 setup has three weeks to reduce credit exposure before a single chargeback is filed.
                </p>
            </div>
        </div>

        <CodeRef
            title="Dynamic Containment Level Evaluation"
            file="backend/containment.py"
            desc={
                <p>
                    The <code>evaluate_containment_level()</code> function implements this dynamically evaluating factors such as <code>signal_strength</code>, <code>elevated_signals</code>, and <code>fraud_hypothesis</code>. For example, if the signal strength is <strong>MODERATE</strong> but the hypothesis identifies an Account Takeover (ATO), the system deliberately restricts mitigation strictly to <strong>Level 1 (Session)</strong> to prevent broader organizational disruption, upgrading to User/Agency level only upon explicit escalation criteria failures.
                </p>
            }
        />
    </div>
);

const FraudTypesTab = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Type 1 */}
            <div className="panel p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-destructive/10 p-2 rounded-lg text-destructive">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Account Takeover (ATO)</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    Legitimate agency account is compromised. Speed is the attacker's only advantage. Measured at the user level, not the agency level.
                </p>
                <div className="bg-secondary/40 rounded p-4 text-xs space-y-1">
                    <p><span className="font-semibold text-primary">Key Signals:</span> S1 (Velocity), S6 (Name Reuse)</p>
                    <p><span className="font-semibold text-primary">Resolution:</span> Session/User limit. Do not auto-freeze agency credit.</p>
                </div>
            </div>

            {/* Type 2 */}
            <div className="panel p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                        <History className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Chargeback Abuse</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    Planned fraud. Shifts behavior gradually over weeks. Detected in Phase 1 (Setup) when refundable ratios climb and lead times compress.
                </p>
                <div className="bg-secondary/40 rounded p-4 text-xs space-y-1">
                    <p><span className="font-semibold text-primary">Key Signals:</span> S2 (Refundable Ratio), S3 (Lead Time)</p>
                    <p><span className="font-semibold text-primary">Resolution:</span> Surgical credit controls at Phase 2 bounds max loss.</p>
                </div>
            </div>

            {/* Type 3 */}
            <div className="panel p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Inventory Blocking</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    Squatting inventory on peak dates to deny competitors. High volume book-then-cancel pattern. No financial signature, purely behavioral.
                </p>
                <div className="bg-secondary/40 rounded p-4 text-xs space-y-1">
                    <p><span className="font-semibold text-primary">Key Signals:</span> S4 (Cancellation Cascades), S7 (Destination Spikes)</p>
                    <p><span className="font-semibold text-primary">Resolution:</span> Booking permission controls (operational, not financial).</p>
                </div>
            </div>

            {/* Type 4 */}
            <div className="panel p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Credit Default Risk</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    Trajectory of worsening payment patterns. Absolute score matters less than velocity of degradation. Detected weeks before a missed payment.
                </p>
                <div className="bg-secondary/40 rounded p-4 text-xs space-y-1">
                    <p><span className="font-semibold text-primary">Key Signals:</span> S5 (Credit Utilization), S8 (Settlement Delay)</p>
                    <p><span className="font-semibold text-primary">Resolution:</span> Progressive contraction ladder. Gradual, never sudden.</p>
                </div>
            </div>
        </div>

        <CodeRef
            title="Hypothesis Determination & Signal Mapping"
            file="backend/bayesian_scoring.py"
            desc={
                <div className="space-y-2">
                    <p>
                        The backend codifies the relationship between signals and fraud categories via the <code>FRAUD_SIGNAL_GROUPS</code> dictionary.
                    </p>
                    <p>
                        The <code>determine_fraud_hypothesis()</code> function sweeps the array of elevated signals (e.g. S2, S3) and identifies overlapping hypothesis intersections. It ranks matching hypotheses descending by pattern completion (<code>match_count</code>) avoiding generic false positives caused by isolated signal triggers.
                    </p>
                </div>
            }
        />
    </div>
);

const SignalsTab = () => (
    <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gold" /> Combination Rule
                </h3>
                <div className="space-y-4 text-sm">
                    <div className="flex gap-4 items-start p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="w-20 shrink-0 font-semibold text-muted-foreground">Weak</div>
                        <div>One signal elevated. <br />→ <span className="text-foreground">Watch only. No action.</span></div>
                    </div>
                    <div className="flex gap-4 items-start p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="w-20 shrink-0 font-semibold text-amber-500">Moderate</div>
                        <div>Two related signals simultaneously. <br />→ <span className="text-foreground">Analyst notification. Surgical controls considered.</span></div>
                    </div>
                    <div className="flex gap-4 items-start p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="w-20 shrink-0 font-semibold text-orange-500">Strong</div>
                        <div>Three+ corroborating signals. <br />→ <span className="text-foreground">Autonomous credit action.</span></div>
                    </div>
                    <div className="flex gap-4 items-start p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div className="w-20 shrink-0 font-semibold text-destructive">Critical</div>
                        <div>Core risk high + amplifier signals firing. <br />→ <span className="text-foreground">Immediate action. Human review classification.</span></div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <Scale className="w-5 h-5 text-gold" /> Bayesian Personalised Weights
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    A conventional system asks: "How much does this signal usually matter?"<br />
                    RiskSense asks: <strong className="text-foreground">"How much has this signal historically mattered for this specific agency?"</strong>
                </p>
                <div className="panel p-5 bg-card/60">
                    <p className="text-sm text-foreground/80 mb-3">
                        If an agency repeatedly triggers S2 (Refundable Ratio) but they legitimately book flexible fares for luxury clients, the weight of S2 automatically drops to near zero for them.
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono bg-background p-3 rounded">
                        <div>S2 Fires HIGH</div>
                        <ArrowRight className="w-3 h-3" />
                        <div>Outcome benign</div>
                        <ArrowRight className="w-3 h-3" />
                        <div className="text-amber-500">Weight Decreases (for this agency)</div>
                    </div>
                </div>
            </div>
        </div>

        <CodeRef
            title="Bayesian Trust Score Calculation"
            file="backend/bayesian_scoring.py"
            desc={
                <div className="space-y-2">
                    <p>
                        Implemented in <code>compute_bayesian_trust_score()</code> and <code>classify_signal_strength()</code> functions. The process leverages cohort priors (<code>PLATFORM_PRIOR</code>, <code>COHORT_PRIORS</code>) configured for dimensions such as "Large International" or "Small Domestic".
                    </p>
                    <p>
                        A signal's F1 reliability acts dynamically as the <strong>posterior weight</strong>. As ground truth observations (True Positive, False Positive) accumulate in the database, the <code>compute_personalised_weights()</code> function continually refines signal significance. If precision drops (due to benign outcomes), the signal's contribution to the total calculated risk automatically deflates. The final Trust Score is inversely calculated from this aggregated dynamic risk variable.
                    </p>
                </div>
            }
        />
    </div>
);

const RiskDecayTab = () => (
    <div className="max-w-4xl">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Natural Trust Recovery</h3>
        <p className="text-muted-foreground mb-8">
            An anomaly from 90 days ago shouldn't permanently define a profile. Signals decay based on half-lives.
            The system never forgets, but it does forgive.
        </p>

        <div className="space-y-3">
            {[
                { name: 'S1 Booking Velocity', time: '7-day', desc: 'Fast — short-term behavioural anomaly' },
                { name: 'S2 Refundable Ratio', time: '14-day', desc: 'Medium — booking pattern shift' },
                { name: 'S4 Cancellation Cascade', time: '30-day', desc: 'Medium — intentional pattern required' },
                { name: 'S5 Credit Utilization', time: '60-day', desc: 'Slow — financial position shifts slowly' },
                { name: 'S8 Settlement Delay', time: '90-day', desc: 'Persistent — payment habits are slow-moving' },
            ].map((sig, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center p-4 panel-glass gap-4 group hover:border-gold/30 transition-colors">
                    <div className="w-48 shrink-0 font-medium text-foreground">{sig.name}</div>
                    <div className="w-24 shrink-0 px-3 py-1 rounded bg-secondary text-xs text-center font-mono text-primary font-bold">
                        {sig.time} half-life
                    </div>
                    <div className="text-sm text-muted-foreground">{sig.desc}</div>
                </div>
            ))}
        </div>

        <div className="mt-10 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">Fairness Guarantee</h4>
            <p className="text-sm text-foreground/80">
                If an override is confirmed, credit is restored within 1 hour. The signal receives a false positive mark, its weight decreases automatically, and the system learns from its mistake. Every false positive makes the model more accurate.
            </p>
        </div>

        <CodeRef
            title="Exponential Decay Logic"
            file="backend/bayesian_scoring.py"
            desc={
                <div className="space-y-2">
                    <p>
                        The risk decay is calculated deterministically via the <code>apply_risk_decay()</code> function, governed by the fixed <code>SIGNAL_HALF_LIVES</code> mapping table.
                    </p>
                    <p>
                        Formula executed: <code>decayed_signal = raw_signal × (0.5 ^ (days_elapsed / half_life))</code>
                    </p>
                    <p>
                        By applying this before the Trust Score computation during the cron orchestrator loop, agencies who maintain 'clean' behavior will transparently see their anomaly magnitudes decrease to non-actionable thresholds automatically.
                    </p>
                </div>
            }
        />
    </div>
);

export default FrameworkExplanation;

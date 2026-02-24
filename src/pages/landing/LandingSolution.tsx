import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Activity, Shield, ArrowRight } from 'lucide-react';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const steps = [
  { icon: Eye, title: 'WATCH', desc: 'Every booking, search, cancellation, and payment is captured from the TBO API every 15 minutes. Nothing is missed.' },
  { icon: Activity, title: 'ANALYSE', desc: '8 risk signals compute in real time. Each maps to a specific fraud type. Each benchmarked against the agency\'s own history and peer cohort.' },
  { icon: Shield, title: 'ACT', desc: 'The Trust Score maps to a decision band. Credit limits adjust automatically. Risk officers are alerted instantly. False positives get a recovery path, not a dead end.' },
];

const bands = [
  { name: 'BLOCKED', range: '0–15', action: 'All credit revoked', color: '#991B1B', bg: '#991B1B20' },
  { name: 'RESTRICTED', range: '16–35', action: 'Credit reduced 50%', color: '#E05C5C', bg: '#E05C5C20' },
  { name: 'WARNING', range: '36–55', action: 'Enhanced monitoring', color: '#E8A830', bg: '#E8A83020' },
  { name: 'CAUTION', range: '56–75', action: 'Standard terms', color: '#E8D44D', bg: '#E8D44D20' },
  { name: 'CLEAR', range: '76–100', action: 'Full credit access', color: '#4CAF82', bg: '#4CAF8220' },
];

const LandingSolution: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bg }}>
    {/* Subtle grid */}
    <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: `linear-gradient(${colors.amber}30 1px, transparent 1px), linear-gradient(90deg, ${colors.amber}30 1px, transparent 1px)`,
      backgroundSize: '80px 80px',
    }} />

    <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.02em' }}>
          Continuous. Behavioural. Predictive.
        </h2>
        <p className="mt-4 max-w-2xl mx-auto" style={{ fontFamily: fonts.body, fontSize: 18, color: colors.muted, lineHeight: 1.7 }}>
          Not rule-based alerts. Not static credit checks. A living risk intelligence engine.
        </p>
      </motion.div>

      {/* 3-step flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {steps.map((s, i) => (
          <motion.div key={i} {...fadeUp(0.1 * i)} className="relative">
            <div className="rounded-xl border p-7 h-full" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.amber}15` }}>
                  <s.icon className="w-5 h-5" style={{ color: colors.amber }} />
                </div>
                <div>
                  <p style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.muted }}>STEP {i + 1}</p>
                  <p style={{ fontFamily: fonts.headline, fontSize: 28, color: colors.white, letterSpacing: '0.04em' }}>{s.title}</p>
                </div>
              </div>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mutedLight, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
            {i < 2 && (
              <div className="hidden md:flex absolute top-1/2 -right-3 z-10 w-6 h-6 rounded-full items-center justify-center" style={{ background: colors.bgCard, border: `1px solid ${colors.border}` }}>
                <ArrowRight className="w-3 h-3" style={{ color: colors.amber }} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Decision Bands */}
      <motion.div {...fadeUp(0.3)}>
        <p className="text-center mb-6" style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Decision Bands</p>
        <div className="flex flex-col sm:flex-row gap-2 rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
          {bands.map((b, i) => (
            <div key={i} className="flex-1 p-4 text-center transition-all hover:scale-[1.02]" style={{ background: b.bg }}>
              <p style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: b.color }}>{b.name}</p>
              <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 }}>{b.range}</p>
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 }}>{b.action}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default LandingSolution;

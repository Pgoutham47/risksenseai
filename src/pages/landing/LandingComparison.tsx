import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const rows = [
  { dim: 'Detection Timing', them: 'After fraud occurs', us: '21 days before chargeback' },
  { dim: 'Signal Design', them: '3–5 obvious signals', us: '8 signals, all 4 fraud types' },
  { dim: 'Threshold Logic', them: 'Fixed platform-wide', us: 'Agency baseline + peer cohort' },
  { dim: 'Decision Communication', them: 'Score only', us: 'Score + explanation + recovery path' },
  { dim: 'TBO Integration', them: 'Simulated data', us: 'Live TBO staging API' },
  { dim: 'False Positive Handling', them: 'Agency blocked, no path', us: 'Counterfactual guidance given' },
  { dim: 'Inventory Blocking', them: 'Not detected', us: 'Cancellation Cascade signal (S4)' },
];

const LandingComparison: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bg }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.04em' }}>
          What Most Teams Build vs. What We Built
        </h2>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="rounded-xl border overflow-hidden" style={{ borderColor: colors.border }}>
        {/* Header */}
        <div className="grid grid-cols-3 gap-0" style={{ background: colors.bgCard }}>
          <div className="p-4 border-r" style={{ borderColor: colors.border }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Dimension</p>
          </div>
          <div className="p-4 border-r" style={{ borderColor: colors.border }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Most Fraud Systems</p>
          </div>
          <div className="p-4" style={{ background: `${colors.amber}10` }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.amber, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>RiskSense AI</p>
          </div>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-3 gap-0" style={{ background: i % 2 === 0 ? colors.bg : colors.bgSlate }}>
            <div className="p-4 border-r border-t" style={{ borderColor: colors.border }}>
              <p style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.white }}>{r.dim}</p>
            </div>
            <div className="p-4 border-r border-t" style={{ borderColor: colors.border }}>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{r.them}</p>
            </div>
            <div className="p-4 border-t" style={{ borderColor: colors.border, background: `${colors.amber}08` }}>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.amber, fontWeight: 600 }}>{r.us}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default LandingComparison;

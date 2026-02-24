import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const innovations = [
  {
    num: '01',
    title: 'Chargeback Early Warning Engine',
    desc: 'Detects fraud 21 days before a chargeback is filed by tracking three distinct behavioural phases: Setup, Escalation, and Crystallisation.',
    callout: 'Most systems detect at Phase 3. We act at Phase 1.',
  },
  {
    num: '02',
    title: 'Counterfactual Resolution Guidance',
    desc: 'When an agency is restricted — even a legitimate false positive — they receive a specific, actionable recovery path with exact thresholds and realistic timelines.',
    callout: "Not 'your score is low.' But 'here's exactly what to do.'",
  },
  {
    num: '03',
    title: 'Peer Cohort Benchmarking',
    desc: 'Each agency is compared against similar agencies by volume, destination profile, and tenure — not platform-wide averages that create systematic false positives.',
    callout: 'Same threshold. Different agency. Completely different meaning.',
  },
];

const LandingInnovations: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bgSlate }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.04em' }}>
          Beyond Detection. Built for the Real World.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {innovations.map((item, i) => (
          <motion.div key={i} {...fadeUp(0.1 * i)} className="rounded-xl border p-7 flex flex-col group hover:-translate-y-1 transition-transform duration-300" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <span className="inline-block mb-5 text-3xl font-bold" style={{ fontFamily: fonts.headline, color: colors.amber, letterSpacing: '0.05em' }}>{item.num}</span>
            <h3 className="mb-4" style={{ fontFamily: fonts.body, fontSize: 20, fontWeight: 700, color: colors.white }}>{item.title}</h3>
            <p className="mb-6 flex-1" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mutedLight, lineHeight: 1.7 }}>{item.desc}</p>
            <div className="rounded-lg p-4 flex gap-3" style={{ borderLeft: `3px solid ${colors.amber}`, background: `${colors.amber}08` }}>
              <p style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.amber, lineHeight: 1.6, fontStyle: 'italic' }}>"{item.callout}"</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingInnovations;

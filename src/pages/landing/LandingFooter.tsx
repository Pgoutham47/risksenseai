import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const stats = [
  { val: '21 Days', label: 'Early warning' },
  { val: '₹3,00,000', label: 'Project value' },
  { val: '8 Signals', label: 'Zero gaps' },
  { val: '15 Minutes', label: 'Live refresh' },
];

const LandingFooter: React.FC = () => (
  <>
    {/* Stats Strip */}
    <section className="relative py-16" style={{ background: `linear-gradient(135deg, ${colors.bg}, #14120E)` }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} {...fadeUp(0.1 * i)} className="text-center">
              <p style={{ fontFamily: fonts.headline, fontSize: 'clamp(36px, 5vw, 52px)', color: colors.amber, textShadow: `0 0 20px ${colors.amberDim}` }}>{s.val}</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-8" style={{ background: colors.bg, borderTop: `1px solid ${colors.border}` }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: colors.amber }} />
            <span style={{ fontFamily: fonts.headline, fontSize: 16, color: colors.white, letterSpacing: '0.05em' }}>RiskSense AI</span>
          </div>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center' }}>
            Built for TBO Hackathon 2025 · Fraud Detection & Credit Risk Intelligence
          </p>
          <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>Powered by TBO B2B Travel API</p>
        </div>
        <div className="mt-6 pt-4 text-center" style={{ borderTop: `1px solid ${colors.borderAmber}` }}>
          <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>© 2025 RiskSense AI</p>
        </div>
      </div>
    </footer>
  </>
);

export default LandingFooter;

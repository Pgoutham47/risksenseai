import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const ScoreGauge: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let current = 0;
        const interval = setInterval(() => {
          current += 1;
          setScore(current);
          if (current >= 73) clearInterval(interval);
        }, 25);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (score / 100) * circumference * 0.75;

  return (
    <div ref={ref} className="relative w-56 h-56 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-[135deg]">
        <circle cx="100" cy="100" r="90" fill="none" stroke={colors.border} strokeWidth="8" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#E8D44D" strokeWidth="8" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-100" style={{ filter: 'drop-shadow(0 0 8px #E8D44D40)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p style={{ fontFamily: fonts.headline, fontSize: 64, lineHeight: 1, color: '#E8D44D', textShadow: '0 0 20px #E8D44D30' }}>{score}</p>
        <span className="mt-1 px-3 py-0.5 rounded text-xs font-bold" style={{ background: '#E8D44D20', color: '#E8D44D', fontFamily: fonts.mono }}>CAUTION</span>
      </div>
    </div>
  );
};

const LandingTrustScore: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bg }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.02em' }}>
          One Number. Total Clarity.
        </h2>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div {...fadeUp(0.1)}>
          <ScoreGauge />
          <p className="text-center mt-6" style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>Updated every 15 minutes</p>
        </motion.div>

        <motion.div {...fadeUp(0.2)}>
          <div className="space-y-5 mb-8">
            {[
              'Weighted combination of all 8 signals',
              'Benchmarked against peer cohort, not platform averages',
              'Tenure-adjusted for new agencies under 90 days',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: colors.amber }} />
                <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.mutedLight, lineHeight: 1.6 }}>{t}</p>
              </div>
            ))}
          </div>

          {/* Counterfactual box */}
          <div className="rounded-xl p-6" style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderLeft: `4px solid ${colors.amber}` }}>
            <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.amber, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Counterfactual Guidance</p>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.white, fontWeight: 600, marginBottom: 12 }}>To move from RESTRICTED → WARNING:</p>
            <div className="space-y-2">
              <p style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.mutedLight }}>↓ Refundable ratio: 79% → below 35%</p>
              <p style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.mutedLight }}>↓ Credit utilization: 88% → below 70%</p>
              <p style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.muted }}>⏱ Estimated: 12–15 days of normal trading</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default LandingTrustScore;

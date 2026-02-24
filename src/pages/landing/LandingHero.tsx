import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const AnimatedBar: React.FC<{ label: string; value: number; delay: number }> = ({ label, value, delay }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), delay * 1000);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mutedLight }}>{label}</span>
        <span style={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.danger }}>{value.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: colors.border }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${colors.danger}, ${colors.amber})` }} />
      </div>
    </div>
  );
};

const LandingHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: colors.bg }}>
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(${colors.amber}20 1px, transparent 1px), linear-gradient(90deg, ${colors.amber}20 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      {/* Amber glow top-right — larger */}
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full" style={{ background: `radial-gradient(circle, ${colors.amberGlow}, transparent 70%)` }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-20 w-full">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left — 60% */}
          <div className="lg:col-span-3">
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8" style={{ borderColor: colors.borderAmber, background: colors.amberGlow, fontFamily: fonts.mono, fontSize: 12, color: colors.amber }}>
                Built for TBO B2B Travel Ecosystem
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} style={{ fontFamily: fonts.headline, fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 1, color: colors.white, letterSpacing: '0.02em' }}>
              Fraud Detected.<br />
              <span style={{ color: colors.amber }}>Before It Costs You.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="mt-6 max-w-xl" style={{ fontFamily: fonts.body, fontSize: 18, lineHeight: 1.7, color: colors.muted }}>
              RiskSense AI monitors every booking, cancellation, and payment in real time — and acts before chargebacks are filed, credit defaults occur, or inventory is blocked.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-4 mt-10">
              <button onClick={() => navigate('/login')} className="h-13 px-8 rounded-lg font-bold text-sm flex items-center gap-2.5 transition-all hover:-translate-y-0.5" style={{ background: colors.amber, color: colors.bg, fontFamily: fonts.body, boxShadow: `0 0 30px ${colors.amberDim}` }}>
                See Live Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button className="h-13 px-8 rounded-lg font-semibold text-sm flex items-center gap-2.5 border transition-all hover:bg-white/10" style={{ borderColor: '#ffffff30', background: 'rgba(255,255,255,0.06)', color: colors.mutedLight, fontFamily: fonts.body }}>
                <FileText className="w-4 h-4" /> Read the Documentation
              </button>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-10 mt-12 pt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
              {[
                { val: '21 Days', label: 'Early chargeback warning' },
                { val: '8 Signals', label: 'Continuous monitoring' },
                { val: '15 Min', label: 'Score refresh cycle' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 700, color: colors.amber }}>{s.val}</p>
                  <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mutedLight, marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Trust Score Card (larger, 3D tilt) */}
          <motion.div {...fadeUp(0.25)} className="lg:col-span-2 relative hidden lg:block" style={{ perspective: '1200px' }}>
            {/* Soft glow behind card */}
            <div className="absolute inset-0 -m-8 rounded-3xl" style={{ background: `radial-gradient(ellipse at center, ${colors.amberGlow}, transparent 70%)` }} />

            {/* Blurred background cards */}
            <div className="absolute -top-10 -left-10 w-56 h-32 rounded-xl border opacity-30 blur-[2px]" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="p-4">
                <p style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.muted }}>TravelMax Ltd</p>
                <p style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: colors.success }}>78</p>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-52 h-28 rounded-xl border opacity-20 blur-[3px]" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="p-4">
                <p style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.muted }}>QuickBook Agency</p>
                <p style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: '#E8B839' }}>58</p>
              </div>
            </div>

            {/* Main card — larger with 3D tilt */}
            <div
              className="relative rounded-2xl border p-8 animate-pulse-glow"
              style={{
                background: colors.bgCard,
                borderColor: colors.borderAmber,
                boxShadow: `0 0 60px ${colors.amberGlow}, 0 25px 80px rgba(0,0,0,0.6)`,
                transform: 'rotateY(-4deg) rotateX(2deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Agency Trust Score</p>
                  <p style={{ fontFamily: fonts.body, fontSize: 18, fontWeight: 700, color: colors.white, marginTop: 4 }}>SkyTravel Pvt Ltd</p>
                </div>
                <span className="px-3 py-1.5 rounded-md text-xs font-bold" style={{ background: `${colors.danger}20`, color: colors.danger, fontFamily: fonts.mono }}>BLOCKED</span>
              </div>

              <div className="flex items-center gap-5 mb-7">
                <div className="text-center">
                  <p style={{ fontFamily: fonts.headline, fontSize: 84, lineHeight: 1, color: colors.danger, textShadow: `0 0 40px ${colors.danger}60` }}>12</p>
                  <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 4 }}>/ 100</p>
                </div>
                <div className="flex-1 pl-5" style={{ borderLeft: `1px solid ${colors.border}` }}>
                  <AnimatedBar label="S1 Velocity" value={0.95} delay={0.8} />
                  <AnimatedBar label="S2 Refundable" value={0.92} delay={1.0} />
                  <AnimatedBar label="S5 Credit" value={0.88} delay={1.2} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-5" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.danger }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>Live Monitoring</span>
                </div>
                <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>Updated 3s ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const fraudColors: Record<string, string> = {
  'Account Takeover': '#E05C5C',
  'Chargeback Abuse': '#E8A830',
  'Credit Default': '#E8D44D',
  'Inventory Blocking': '#5B9BD5',
  'Chargeback + Blocking': '#C77DBA',
};

const signals = [
  { id: 'S1', name: 'Booking Velocity', fraud: 'Account Takeover', weight: '22%', risk: 82, desc: 'Detects booking rates 3× above the agency\'s own 90-day average within a 2-hour window.' },
  { id: 'S2', name: 'Refundable Ratio', fraud: 'Chargeback Abuse', weight: '20%', risk: 75, desc: 'Flags when refundable bookings jump 50+ percentage points above the agency\'s historical baseline in 7 days.' },
  { id: 'S3', name: 'Lead Time Compression', fraud: 'Chargeback Abuse', weight: '12%', risk: 60, desc: 'Catches agencies booking unusually close to check-in dates — a hallmark of fraudsters who never intend to send real guests.' },
  { id: 'S4', name: 'Cancellation Cascade', fraud: 'Inventory Blocking', weight: '8%', risk: 45, desc: 'Identifies booking bursts followed by mass cancellations within hours — the fingerprint of deliberate inventory manipulation.' },
  { id: 'S5', name: 'Credit Utilization', fraud: 'Credit Default', weight: '16%', risk: 88, desc: 'Monitors outstanding balance as a percentage of approved credit limit. Rises above 60% enter progressive risk scoring.' },
  { id: 'S6', name: 'Passenger Name Reuse', fraud: 'Account Takeover', weight: '4%', risk: 30, desc: 'Detects the same guest names appearing across many bookings — the signature of fabricated placeholder passengers.' },
  { id: 'S7', name: 'Destination Concentration', fraud: 'Chargeback + Blocking', weight: '4%', risk: 35, desc: 'Flags when 70%+ of bookings concentrate on a single city, departing sharply from the agency\'s historical diversity.' },
  { id: 'S8', name: 'Settlement Delay', fraud: 'Credit Default', weight: '14%', risk: 70, desc: 'Tracks invoice payment delays over 90 days. A growing trend predicts default weeks before it happens.' },
];

const ProgressBar: React.FC<{ risk: number; color: string }> = ({ risk, color }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setWidth(risk); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [risk]);
  return (
    <div ref={ref} className="w-full h-1.5 rounded-full mt-4" style={{ background: colors.border }}>
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, background: color }} />
    </div>
  );
};

const LandingSignals: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bgSlate }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.04em' }}>
          Eight Signals. Four Fraud Types. Zero Blind Spots.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {signals.map((s, i) => {
          const fColor = fraudColors[s.fraud] || colors.amber;
          return (
            <motion.div key={i} {...fadeUp(0.05 * i)} className="rounded-xl border p-5 group hover:-translate-y-1 transition-transform duration-300" style={{ background: colors.bgCard, borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded font-bold" style={{ fontFamily: fonts.mono, fontSize: 11, background: `${colors.amber}15`, color: colors.amber }}>{s.id}</span>
                <span className="px-2 py-0.5 rounded" style={{ fontFamily: fonts.mono, fontSize: 10, background: `${colors.amber}12`, color: colors.amber, fontWeight: 600 }}>{s.weight}</span>
              </div>
              <h3 style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 700, color: colors.white }}>{s.name}</h3>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${fColor}18`, color: fColor, fontFamily: fonts.mono }}>{s.fraud}</span>
              <p className="mt-3" style={{ fontFamily: fonts.body, fontSize: 12, color: colors.mutedLight, lineHeight: 1.65 }}>{s.desc}</p>
              <ProgressBar risk={s.risk} color={fColor} />
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default LandingSignals;

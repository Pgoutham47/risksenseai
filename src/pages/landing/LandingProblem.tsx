import React from 'react';
import { motion } from 'framer-motion';
import { UserX, CreditCard, TrendingDown, Package } from 'lucide-react';
import { colors, fonts } from './LandingStyles';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const problems = [
  { icon: UserX, name: 'Account Takeover', desc: 'Stolen credentials. Refundable bookings. Refunds claimed before breach is detected.', loss: 'Full refund value, unrecoverable.' },
  { icon: CreditCard, name: 'Chargeback Abuse', desc: 'Mass refundable bookings, then disputes filed. Resolution takes 60–90 days.', loss: 'Inventory consumed, money gone.' },
  { icon: TrendingDown, name: 'Credit Default', desc: 'Agency uses TBO credit as emergency capital. Payment delays grow silently for months.', loss: 'Full outstanding balance at time of default.' },
  { icon: Package, name: 'Inventory Blocking', desc: 'Bulk bookings on peak dates, cancelled before deadline. Competitors locked out, suppliers damaged.', loss: 'Supplier relationships and platform reputation.' },
];

const LandingProblem: React.FC = () => (
  <section className="relative py-24 md:py-32" style={{ background: colors.bgSlate }}>
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <h2 style={{ fontFamily: fonts.headline, fontSize: 'clamp(32px, 5vw, 56px)', color: colors.white, letterSpacing: '0.04em' }}>
          The Gap That Costs Platforms Everything
        </h2>
        <p className="mt-4 max-w-2xl mx-auto" style={{ fontFamily: fonts.body, fontSize: 18, color: colors.muted, lineHeight: 1.7 }}>
          TBO pays suppliers upfront. Agencies pay later. Fraud lives in that window.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {problems.map((p, i) => (
          <motion.div key={i} {...fadeUp(0.1 * i)} className="rounded-xl border p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300" style={{ background: colors.bgCard, borderColor: colors.border }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: colors.danger }} />
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${colors.danger}15` }}>
                <p.icon className="w-5 h-5" style={{ color: colors.danger }} />
              </div>
              <div>
                <h3 style={{ fontFamily: fonts.body, fontSize: 18, fontWeight: 700, color: colors.amber }}>{p.name}</h3>
                <p className="mt-2" style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mutedLight, lineHeight: 1.6 }}>{p.desc}</p>
                <p className="mt-3 text-xs" style={{ fontFamily: fonts.mono }}>
                  <span style={{ color: colors.danger, fontWeight: 700 }}>Loss:</span>{' '}
                  <span style={{ color: colors.mutedLight }}>{p.loss}</span>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeUp(0.4)} className="mt-10 rounded-xl py-8 px-6 md:px-10 text-center" style={{ background: colors.amber, color: colors.bg }}>
        <p style={{ fontFamily: fonts.body, fontSize: 17, fontWeight: 700, lineHeight: 1.7 }}>
          Current systems have no mechanism to detect any of this in real time. RiskSense AI is built to fix exactly that.
        </p>
      </motion.div>
    </div>
  </section>
);

export default LandingProblem;

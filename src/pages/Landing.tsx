import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Building2, Bell, BarChart3, Lock, Zap, Eye, ChevronRight, Star, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const Landing: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();

  const features = [
    { icon: Activity, label: 'Real-Time Signals', desc: '8 proprietary risk signals scored in sub-second using ML pipelines for instant threat detection.' },
    { icon: Building2, label: 'Agency Oversight', desc: 'Monitor 500+ agencies with automated trust band classification and credit exposure tracking.' },
    { icon: Bell, label: 'Smart Alerts', desc: 'AI-powered anomaly detection with configurable severity thresholds and escalation workflows.' },
    { icon: BarChart3, label: 'Deep Analytics', desc: 'Cohort analysis, trend forecasting, and executive-ready reporting with exportable dashboards.' },
    { icon: Zap, label: 'Fraud Simulation', desc: 'What-if scenario engine lets analysts model signal changes and predict band movements.' },
    { icon: Eye, label: 'Audit & Compliance', desc: 'Complete action trail with timestamped logs, user attribution, and SOC 2 compliance.' },
  ];

  const stats = [
    { value: '500+', label: 'Agencies Monitored' },
    { value: '₹29.9L', label: 'Credit Exposure Tracked' },
    { value: '99.7%', label: 'Detection Accuracy' },
    { value: '<200ms', label: 'Scoring Latency' },
  ];

  const testimonials = [
    {
      quote: "RiskSense reduced our fraud losses by 68% in the first quarter. The real-time scoring is a game-changer for our operations.",
      name: 'Priya Sharma',
      role: 'VP Risk Management',
      company: 'IndiaTravel Corp',
    },
    {
      quote: "The simulator alone saved us from three potential high-exposure defaults. We can now proactively manage agency risk.",
      name: 'Arjun Mehta',
      role: 'Chief Risk Officer',
      company: 'GlobalFlight Holdings',
    },
    {
      quote: "Finally, a platform that gives us full visibility across our entire agency portfolio. The audit trail is invaluable for compliance.",
      name: 'Neha Kapoor',
      role: 'Head of Compliance',
      company: 'SkyWave Aviation',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Navigation — transparent on hero, solid on scroll */}
      <header
        className="w-full flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrollY > 80 ? 'hsl(var(--background) / 0.95)' : 'transparent',
          backdropFilter: scrollY > 80 ? 'blur(16px)' : 'none',
          borderBottom: scrollY > 80 ? '1px solid hsl(var(--border))' : '1px solid transparent',
          boxShadow: scrollY > 80 ? '0 4px 20px hsl(25 30% 10% / 0.12)' : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="font-heading text-sm tracking-wider" style={{ color: scrollY > 80 ? 'hsl(var(--foreground))' : 'hsl(0 0% 95%)' }}>RiskSense</span>
            <span className="block text-[9px] font-mono tracking-[0.2em]" style={{ color: scrollY > 80 ? 'hsl(var(--muted-foreground))' : 'hsl(0 0% 60%)' }}>AI PLATFORM</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'Results', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm transition-colors hover:text-accent" style={{ color: scrollY > 80 ? 'hsl(var(--muted-foreground))' : 'hsl(0 0% 70%)' }}>{item}</a>
            ))}
          </nav>
          <button
            onClick={() => navigate('/login')}
            className="h-9 px-5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-2 hover:bg-accent/90 transition-all shadow-sm hover:shadow-md"
          >
            Login
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{
            backgroundImage: 'url(/images/hero-bg.png)',
            transform: `translateY(${scrollY * 0.35}px) scale(1.1)`,
          }}
        />
        {/* Dark overlay — stronger for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/50" />
        {/* Bottom gradient fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        {/* Accent glow */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, hsl(38 60% 55%), transparent 70%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-32 w-full">
          <div className="max-w-2xl">
            <motion.div {...fadeUp(0)}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-8">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-accent tracking-wide">AI-Powered Risk Intelligence</span>
              </div>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} className="font-heading text-4xl md:text-5xl xl:text-[3.75rem] font-extrabold leading-[1.08] mb-6 drop-shadow-lg" style={{ color: 'hsl(0 0% 98%)' }}>
              Protect Your Revenue.<br />
              <span className="text-accent drop-shadow-md">Outsmart Fraud.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-base md:text-lg max-w-lg leading-relaxed mb-10 font-medium" style={{ color: 'hsl(0 0% 78%)' }}>
              Enterprise-grade AI platform for real-time agency monitoring, trust scoring, and fraud detection — unified in one powerful command center.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, hsl(38 60% 50%), hsl(30 55% 42%))',
                  color: 'hsl(25 35% 10%)',
                }}
              >
                Access Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="h-12 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20"
                style={{ color: 'hsl(0 0% 95%)' }}
              >
                Explore Features
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Floating stats row */}
            <motion.div {...fadeUp(0.45)} className="flex flex-wrap gap-8 md:gap-10 mt-16 pt-8 border-t border-white/10">
              {stats.map((s, i) => (
                <div key={i} className="text-left">
                  <p className="font-mono text-2xl md:text-3xl font-bold text-accent drop-shadow-sm">{s.value}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'hsl(0 0% 60%)' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section id="features" className="px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-16">
            <span className="text-xs font-semibold text-accent tracking-widest uppercase mb-3 block">Platform Capabilities</span>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-5">
              Everything You Need to<br />Manage Agency Risk
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
              From real-time scoring to compliance reporting, every tool purpose-built for risk professionals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.05 * i)}
                className="group rounded-xl border border-border bg-card p-6 hover:border-accent/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                style={{ boxShadow: '0 2px 8px hsl(25 30% 15% / 0.05)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 group-hover:shadow-md transition-all">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-foreground text-sm font-bold mb-2.5">{f.label}</p>
                <p className="text-muted-foreground text-xs leading-relaxed min-h-[3rem]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 md:px-12 lg:px-20 py-20 md:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <span className="text-xs font-semibold text-accent tracking-widest uppercase mb-3 block">Trusted by Industry Leaders</span>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              What Risk Professionals Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.1 * i)}
                className="rounded-xl border border-border bg-card p-7 flex flex-col hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: '0 2px 12px hsl(25 30% 15% / 0.05)' }}
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent/80 text-accent/80" />
                  ))}
                </div>
                <p className="text-foreground text-[15px] leading-relaxed mb-7 flex-1 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-border">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'hsl(38 60% 50% / 0.12)', color: 'hsl(38 60% 50%)' }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{t.name}</p>
                    <p className="text-muted-foreground text-[11px]">{t.role}</p>
                    <p className="text-accent text-[11px] font-medium">{t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20 md:py-28">
        <motion.div {...fadeUp(0)} className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl p-10 md:p-14 relative overflow-hidden border border-white/5" style={{ background: 'linear-gradient(135deg, hsl(25 30% 12%), hsl(25 25% 18%))' }}>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle, hsl(38 60% 50%), transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, hsl(38 60% 60%), transparent 70%)' }} />
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 1px 0 hsl(38 60% 50% / 0.08)' }} />
            <div className="relative z-10">
              <ShieldCheck className="w-12 h-12 mx-auto mb-6" style={{ color: 'hsl(38 55% 65%)' }} />
              <h2 className="font-heading text-2xl md:text-3xl mb-4" style={{ color: 'hsl(30 20% 94%)' }}>
                Ready to Protect Your Business?
              </h2>
              <p className="text-sm md:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(30 12% 65%)' }}>
                Join leading enterprises using RiskSense AI to detect fraud, manage agency risk, and safeguard revenue in real-time.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2.5 mx-auto transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, hsl(38 60% 50%), hsl(30 55% 42%))',
                  color: 'hsl(25 35% 10%)',
                }}
              >
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-6 py-6 border-t border-border">
        {[
          { icon: Lock, text: '256-bit TLS Encrypted' },
          { icon: ShieldCheck, text: 'SOC 2 Type II Compliant' },
          { icon: Users, text: 'Enterprise Ready' },
        ].map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            <b.icon className="w-3.5 h-3.5" />
            <span className="text-xs">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-20 py-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 RiskSense AI · Enterprise License</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Building2, Bell, BarChart3, Lock, Zap, Eye, ChevronRight, Star, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const Landing: React.FC = () => {
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
      {/* Navigation */}
      <header className="w-full flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="font-heading text-sm text-foreground tracking-wider">RiskSense</span>
            <span className="block text-[9px] text-muted-foreground font-mono tracking-[0.2em]">AI PLATFORM</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Results</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg.png)' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
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

            <motion.h1 {...fadeUp(0.1)} className="font-heading text-4xl md:text-5xl xl:text-[3.5rem] leading-[1.1] mb-6" style={{ color: 'hsl(0 0% 97%)' }}>
              Protect Your Revenue.<br />
              <span className="text-accent">Outsmart Fraud.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-base md:text-lg max-w-lg leading-relaxed mb-10" style={{ color: 'hsl(0 0% 75%)' }}>
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
                className="h-12 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all border border-white/15 backdrop-blur-sm hover:bg-white/10"
                style={{ color: 'hsl(0 0% 90%)' }}
              >
                Explore Features
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Floating stats row */}
            <motion.div {...fadeUp(0.45)} className="flex flex-wrap gap-6 mt-14">
              {stats.map((s, i) => (
                <div key={i} className="text-left">
                  <p className="font-mono text-xl md:text-2xl font-bold text-accent">{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'hsl(0 0% 55%)' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section id="features" className="px-6 md:px-12 lg:px-20 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <span className="text-xs font-semibold text-accent tracking-widest uppercase mb-3 block">Platform Capabilities</span>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Everything You Need to<br />Manage Agency Risk
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              From real-time scoring to compliance reporting, every tool purpose-built for risk professionals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.05 * i)}
                className="group rounded-xl border border-border bg-card p-6 hover:border-accent/25 transition-all duration-300 relative overflow-hidden"
                style={{ boxShadow: '0 1px 3px hsl(25 30% 15% / 0.04)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-foreground text-sm font-bold mb-2">{f.label}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.1 * i)}
                className="rounded-xl border border-border bg-card p-6 flex flex-col"
                style={{ boxShadow: '0 2px 8px hsl(25 30% 15% / 0.04)' }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'hsl(38 60% 50% / 0.12)', color: 'hsl(38 60% 50%)' }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-foreground text-xs font-semibold">{t.name}</p>
                    <p className="text-muted-foreground text-[11px]">{t.role}, {t.company}</p>
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
          <div className="rounded-2xl p-10 md:p-14 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(25 30% 12%), hsl(25 25% 18%))' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(38 60% 50%), transparent 70%)' }} />
            <div className="relative z-10">
              <ShieldCheck className="w-10 h-10 mx-auto mb-5" style={{ color: 'hsl(38 55% 65%)' }} />
              <h2 className="font-heading text-2xl md:text-3xl mb-4" style={{ color: 'hsl(30 20% 92%)' }}>
                Ready to Protect Your Business?
              </h2>
              <p className="text-sm md:text-base mb-8 max-w-lg mx-auto" style={{ color: 'hsl(30 12% 60%)' }}>
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

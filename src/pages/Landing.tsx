import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Building2, Bell, BarChart3, Lock, Zap, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Activity, label: 'Real-Time Signals', desc: 'Live fraud & risk scoring across all agencies' },
    { icon: Building2, label: 'Agency Oversight', desc: 'Monitor 500+ agencies with trust band classification' },
    { icon: Bell, label: 'Smart Alerts', desc: 'AI-powered anomaly detection & escalation workflows' },
    { icon: BarChart3, label: 'Deep Analytics', desc: 'Cohort analysis, trend forecasting & executive reporting' },
    { icon: Zap, label: 'Instant Scoring', desc: 'Sub-second risk assessments powered by ML pipelines' },
    { icon: Eye, label: 'Full Visibility', desc: 'Unified command center for your entire risk portfolio' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="w-full flex items-center justify-between px-6 md:px-12 py-4 bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-heading text-sm text-foreground tracking-wider">RiskSense</span>
            <span className="block text-[9px] text-muted-foreground font-mono tracking-[0.2em]">AI PLATFORM</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          Login
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary tracking-wide">AI-Powered Risk Intelligence</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-5">
            Intelligent Risk<br />Management Platform
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Enterprise-grade AI for real-time agency monitoring, fraud detection, and trust scoring — all unified in one command center.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate('/login')}
              className="h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full"
        >
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center mb-3">
                <f.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-foreground text-sm font-semibold mb-1">{f.label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex items-center gap-2 mt-12 text-muted-foreground"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs">256-bit TLS encrypted · SOC 2 Compliant · Enterprise Ready</span>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">© 2026 RiskSense AI · Enterprise License</p>
      </footer>
    </div>
  );
};

export default Landing;

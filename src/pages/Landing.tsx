import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Building2, Bell, BarChart3, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Frontend-only: simulate login
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 800);
  };

  const features = [
    { icon: Activity, label: 'Real-Time Signals', desc: 'Live fraud & risk scoring across all agencies' },
    { icon: Building2, label: 'Agency Oversight', desc: 'Monitor 500+ agencies with trust band classification' },
    { icon: Bell, label: 'Smart Alerts', desc: 'AI-powered anomaly detection & escalation' },
    { icon: BarChart3, label: 'Deep Analytics', desc: 'Cohort analysis, trend forecasting & reporting' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — Branding & Features */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-12 xl:p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(222 47% 15%), hsl(222 47% 22%))' }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-heading text-lg text-white tracking-wider">RiskSense</span>
              <span className="block text-[10px] text-white/50 font-mono tracking-[0.2em]">AI PLATFORM</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <h1 className="font-heading text-4xl xl:text-5xl text-white leading-tight mb-4">
              Intelligent Risk<br />Management
            </h1>
            <p className="text-white/60 text-base max-w-md leading-relaxed">
              Enterprise-grade AI platform for real-time agency monitoring, fraud detection, and trust scoring — all in one command center.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative z-10 grid grid-cols-2 gap-4"
        >
          {features.map((f, i) => (
            <div key={i} className="rounded-xl bg-white/[0.06] backdrop-blur border border-white/[0.08] p-4">
              <f.icon className="w-5 h-5 text-white/70 mb-2.5" />
              <p className="text-white text-sm font-semibold mb-1">{f.label}</p>
              <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        <div className="relative z-10 text-white/30 text-xs">
          © 2026 RiskSense AI · Enterprise License
        </div>
      </div>

      {/* Right — Login */}
      <div className="flex-1 lg:max-w-[520px] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-12 lg:hidden">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-base text-foreground tracking-wider">RiskSense AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-8">
            <h2 className="font-heading text-2xl text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">Sign in to access the command center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground tracking-wide uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@risksense.ai"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground tracking-wide uppercase">Password</label>
                <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded border-input" />
              <label htmlFor="remember" className="text-xs text-muted-foreground">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs">256-bit TLS encrypted · SOC 2 Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;

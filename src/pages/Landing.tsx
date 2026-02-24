import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import LandingHero from './landing/LandingHero';
import LandingProblem from './landing/LandingProblem';
import LandingSolution from './landing/LandingSolution';
import LandingSignals from './landing/LandingSignals';
import LandingTrustScore from './landing/LandingTrustScore';
import LandingInnovations from './landing/LandingInnovations';
import LandingComparison from './landing/LandingComparison';
import LandingFooter from './landing/LandingFooter';
import { colors, fonts } from './landing/LandingStyles';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg, scrollBehavior: 'smooth' }}>
      {/* Sticky Nav */}
      <header
        className="w-full flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrollY > 80 ? `${colors.bg}F0` : 'transparent',
          backdropFilter: scrollY > 80 ? 'blur(16px)' : 'none',
          borderBottom: scrollY > 80 ? `1px solid ${colors.border}` : '1px solid transparent',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${colors.amber}15` }}>
            <Shield className="w-5 h-5" style={{ color: colors.amber }} />
          </div>
          <div>
            <span style={{ fontFamily: fonts.headline, fontSize: 14, color: colors.white, letterSpacing: '0.08em' }}>RiskSense</span>
            <span className="block" style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.muted, letterSpacing: '0.2em' }}>AI PLATFORM</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'Signals', 'Compare'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm transition-colors" style={{ fontFamily: fonts.body, color: scrollY > 80 ? colors.mutedLight : colors.muted }}>
                {item}
              </a>
            ))}
          </nav>
          <button
            onClick={() => navigate('/login')}
            className="h-9 px-5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: colors.amber, color: colors.bg, fontFamily: fonts.body, boxShadow: `0 0 20px ${colors.amberGlow}` }}
          >
            Login <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <LandingHero />
      <LandingProblem />
      <div id="features"><LandingSolution /></div>
      <div id="signals"><LandingSignals /></div>
      <LandingTrustScore />
      <LandingInnovations />
      <div id="compare"><LandingComparison /></div>
      <LandingFooter />

      {/* Pulse glow animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px ${colors.amberGlow}, 0 20px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 50px ${colors.amberDim}, 0 20px 60px rgba(0,0,0,0.5); }
        }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Landing;

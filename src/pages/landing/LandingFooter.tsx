import React from 'react';
import { Shield } from 'lucide-react';
import { colors, fonts } from './LandingStyles';

const LandingFooter: React.FC = () => (
  <>

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

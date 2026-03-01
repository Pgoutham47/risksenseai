import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedScoreProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ value, className = '', duration = 1000 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = 0;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <span className={`font-mono ${className}`}>{display}</span>;
};

// Animated currency counter (e.g. ₹84.0L)
interface AnimatedCurrencyProps {
  value: number;
  className?: string;
  duration?: number;
}

export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({ value, className = '', duration = 1200 }) => {
  const [display, setDisplay] = useState('₹0');
  const ref = useRef<number>();

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      if (current >= 100000) setDisplay(`₹${(current / 100000).toFixed(1)}L`);
      else if (current >= 1000) setDisplay(`₹${(current / 1000).toFixed(0)}K`);
      else setDisplay(`₹${Math.round(current)}`);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);

  return <span className={`font-mono ${className}`}>{display}</span>;
};

interface SignalGaugeProps {
  score: number;
  size?: number;
}

export const SignalGauge: React.FC<SignalGaugeProps> = ({ score = 0, size = 56 }) => {
  const radius = (size - 8) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - score);
  const color = score >= 0.7 ? 'hsl(0, 72%, 51%)' : score >= 0.4 ? 'hsl(38, 92%, 50%)' : 'hsl(152, 60%, 36%)';

  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      <path
        d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
        fill="none"
        stroke="hsl(220, 13%, 91%)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 2}
        textAnchor="middle"
        fill={color}
        fontSize="12"
        fontFamily="JetBrains Mono"
        fontWeight="600"
      >
        {score.toFixed(2)}
      </text>
    </svg>
  );
};

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25 }}
    className="h-full"
  >
    {children}
  </motion.div>
);

// Dashboard skeleton loader
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse">
    {/* KPI skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="kpi-card h-[120px]">
          <div className="flex items-start justify-between mb-4">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="w-9 h-9 rounded-lg bg-muted" />
          </div>
          <div className="h-7 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
    {/* Grid skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 panel-glass p-6 h-[360px]">
        <div className="h-3 w-32 rounded bg-muted mb-6" />
        <div className="w-[200px] h-[200px] rounded-full bg-muted mx-auto" />
      </div>
      <div className="lg:col-span-8 panel-glass p-6 h-[360px]">
        <div className="h-3 w-40 rounded bg-muted mb-6" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 rounded bg-muted mb-2" />
        ))}
      </div>
    </div>
  </div>
);

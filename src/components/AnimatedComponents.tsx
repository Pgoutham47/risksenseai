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

interface SignalGaugeProps {
  score: number;
  size?: number;
}

export const SignalGauge: React.FC<SignalGaugeProps> = ({ score, size = 56 }) => {
  const radius = (size - 8) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - score);
  const color = score >= 0.7 ? 'hsl(0, 65%, 55%)' : score >= 0.4 ? 'hsl(38, 90%, 55%)' : 'hsl(142, 70%, 42%)';

  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      <path
        d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
        fill="none"
        stroke="hsl(220, 12%, 18%)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <motion.path
        d={`M 4 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2 + 4}`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
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

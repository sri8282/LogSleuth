import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'warning' | 'error' | 'magenta' | 'default';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: {
      card: 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700',
      badge: 'text-slate-400 bg-slate-800/50 border-slate-700/50',
      accentGlow: 'from-slate-500/10 to-transparent',
      textColor: 'text-slate-100',
      pillColor: 'text-slate-400',
    },
    cyan: {
      card: 'border-cyan-500/25 bg-gradient-to-b from-cyan-950/20 to-slate-900/50 hover:border-cyan-400/50',
      badge: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60',
      accentGlow: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
      textColor: 'text-cyan-200',
      pillColor: 'text-cyan-400',
    },
    warning: {
      card: 'border-amber-500/25 bg-gradient-to-b from-amber-950/20 to-slate-900/50 hover:border-amber-400/50',
      badge: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
      accentGlow: 'from-amber-500/15 via-amber-500/5 to-transparent',
      textColor: 'text-amber-200',
      pillColor: 'text-amber-400',
    },
    error: {
      card: 'border-rose-500/25 bg-gradient-to-b from-rose-950/20 to-slate-900/50 hover:border-rose-400/50',
      badge: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
      accentGlow: 'from-rose-500/15 via-rose-500/5 to-transparent',
      textColor: 'text-rose-200',
      pillColor: 'text-rose-400',
    },
    magenta: {
      card: 'border-fuchsia-500/25 bg-gradient-to-b from-fuchsia-950/20 to-slate-900/50 hover:border-fuchsia-400/50',
      badge: 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-800/60',
      accentGlow: 'from-fuchsia-500/15 via-fuchsia-500/5 to-transparent',
      textColor: 'text-fuchsia-200',
      pillColor: 'text-fuchsia-400',
    },
  }[variant];

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`relative p-4 rounded-xl border backdrop-blur-md transition-all duration-200 overflow-hidden shadow-lg shadow-black/30 group ${variantStyles.card}`}
    >
      {/* Soft ambient top light strip */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${variantStyles.accentGlow}`}
      />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>
        <div
          className={`p-2 rounded-lg border transition-colors group-hover:scale-105 ${variantStyles.badge}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${variantStyles.textColor}`}>
          <AnimatedCounter value={value} />
        </div>
        
        <div className="mt-1.5 flex items-center justify-between text-xs">
          {subtitle && (
            <p className="text-slate-400 text-[11px] truncate">{subtitle}</p>
          )}
          {trend && (
            <span className={`text-[10px] font-mono shrink-0 ${variantStyles.pillColor}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

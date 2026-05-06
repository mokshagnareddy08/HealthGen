import React from 'react';
import { cn } from '../../services/utils';

interface CircularProgressProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trackColor?: string;
  subtitle?: string;
  className?: string;
}

export const CircularProgress = ({
  value,
  target,
  label,
  unit = '',
  size = 132,
  strokeWidth = 10,
  strokeColor = '#8b5cf6',
  trackColor = 'rgba(255,255,255,0.8)',
  subtitle,
  className,
}: CircularProgressProps) => {
  const safeTarget = target > 0 ? target : 1;
  const rawPercent = (value / safeTarget) * 100;
  const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn('rounded-[24px] border border-white/70 bg-white/55 backdrop-blur-xl p-4 shadow-[0_18px_40px_-28px_rgba(148,163,184,0.42)]', className)}>
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="transparent" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-2xl font-black text-slate-900 leading-none">{Math.round(value)}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 mt-2">{unit}</span>
            <span className="text-xs font-semibold text-slate-700 mt-1">{percent}%</span>
          </div>
        </div>
      </div>
      <div className="text-center mt-3 space-y-1">
        <p className="text-[13px] font-black text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">Target {Math.round(target)} {unit}</p>
        {subtitle ? <p className="text-[10px] text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  );
};

export default CircularProgress;

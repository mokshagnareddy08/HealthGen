import React from 'react';
import { cn } from '../../services/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}

export const Badge = ({ children, className, variant = 'info', ...props }: BadgeProps) => {
  const variants = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-brand-100 text-brand-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
};

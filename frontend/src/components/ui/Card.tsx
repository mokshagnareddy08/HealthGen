import React from 'react';
import { cn } from '../../services/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        "bg-white/65 backdrop-blur-xl rounded-[28px] shadow-[0_20px_50px_-30px_rgba(148,163,184,0.45)] border border-white/70 p-6 hover:shadow-[0_24px_60px_-30px_rgba(148,163,184,0.55)] transition-all duration-300",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

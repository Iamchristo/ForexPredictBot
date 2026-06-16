'use client';
import { cn } from '@/lib/utils';
import React from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
  borderRadius?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ShimmerButton({
  shimmerColor = 'rgba(255, 255, 255, 0.4)',
  background = 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  borderRadius = '12px',
  children,
  className,
  size = 'md',
  ...props
}: ShimmerButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'relative group overflow-hidden font-semibold text-bg transition-all duration-300',
        'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
        sizeClasses[size],
        className
      )}
      style={{ background, borderRadius }}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

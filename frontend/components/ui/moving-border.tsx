'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 3000,
  rx = '16px',
  ry = '16px',
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);

  return (
    <div className={cn('relative p-[1px] overflow-hidden rounded-2xl', containerClassName)}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ zIndex: 0 }}
      >
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`borderGrad-${duration}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#F59E0B" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur={`${duration / 1000}s`}
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <rect
            ref={pathRef}
            x="0" y="0"
            width="100%" height="100%"
            rx={rx} ry={ry}
            fill="none"
            stroke={`url(#borderGrad-${duration})`}
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className={cn('relative z-10 rounded-2xl bg-surface', className)}>
        {children}
      </div>
    </div>
  );
}

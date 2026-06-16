'use client';
import { cn } from '@/lib/utils';

export function AnimatedGradientText({
  children,
  className,
  gradient = 'linear-gradient(90deg, #F59E0B, #FCD34D, #6366F1, #F59E0B)',
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}) {
  return (
    <span
      className={cn('bg-clip-text text-transparent animate-shimmer', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% auto',
      }}
    >
      {children}
    </span>
  );
}

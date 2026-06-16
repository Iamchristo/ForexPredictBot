'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) {
  const variants = {
    initial: { backgroundPosition: '0% 50%' },
    animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
  };

  return (
    <div className={cn('relative p-[2px] rounded-2xl group', containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundSize: '300% 300%',
          backgroundImage: `radial-gradient(circle at top left, #F59E0B, #6366F1, #10B981, #F59E0B)`,
        }}
        className="absolute inset-0 rounded-2xl opacity-60 blur-sm"
      />
      <div className={cn('relative z-10 rounded-[14px] bg-surface', className)}>
        {children}
      </div>
    </div>
  );
}

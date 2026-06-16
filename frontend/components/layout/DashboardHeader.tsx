'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({ title, showBack = false, rightElement, className }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn('flex items-center justify-between px-4 py-3 safe-top border-b border-border bg-bg/95 backdrop-blur-sm sticky top-0 z-40', className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-muted hover:text-slate-100 transition-colors rounded-lg hover:bg-surface"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <button className="relative p-2 text-muted hover:text-slate-100 transition-colors rounded-lg hover:bg-surface">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
        </button>
      </div>
    </header>
  );
}

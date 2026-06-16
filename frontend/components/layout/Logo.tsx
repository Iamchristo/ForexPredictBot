import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 24, text: 'text-base', sub: 'text-xs' },
    md: { icon: 32, text: 'text-xl', sub: 'text-sm' },
    lg: { icon: 44, text: 'text-3xl', sub: 'text-base' },
  };
  const s = sizes[size];

  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex-shrink-0">
        <svg width={s.icon} height={s.icon} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="44" x2="44" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>
          </defs>
          <rect width="44" height="44" rx="10" fill="#1A1A2E" />
          {/* Chart line */}
          <polyline
            points="6,32 14,22 20,26 28,14 36,18"
            stroke="url(#logoGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Sparkle */}
          <circle cx="36" cy="10" r="3" fill="#FCD34D" opacity="0.9" />
          <line x1="36" y1="6" x2="36" y2="8" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="12" x2="36" y2="14" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="10" x2="34" y2="10" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="38" y1="10" x2="40" y2="10" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-bold text-slate-100 leading-tight', s.text)}>
          ForexPredict<span className="gold-text">Bot AI</span>
        </span>
        <span className={cn('text-muted leading-tight', s.sub)}>Precision Trading</span>
      </div>
    </Link>
  );
}

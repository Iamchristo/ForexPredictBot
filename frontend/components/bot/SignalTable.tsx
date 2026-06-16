'use client';
import { motion } from 'framer-motion';
import type { Signal } from '@/types';
import { cn } from '@/lib/utils';

function SignalBadge({ signal }: { signal: string }) {
  const cls = {
    BUY: 'badge-buy',
    SELL: 'badge-sell',
    NEUTRAL: 'badge-neutral',
  }[signal] ?? 'badge-neutral';
  return <span className={cls}>{signal}</span>;
}

export function SignalTable({ signals }: { signals: Signal[] }) {
  const sorted = [...signals].sort((a, b) => {
    const order = { BUY: 0, SELL: 1, NEUTRAL: 2 };
    return (order[a.signal as keyof typeof order] ?? 2) - (order[b.signal as keyof typeof order] ?? 2);
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-300 px-1">Signal Breakdown</h4>
      <div className="space-y-1.5">
        {sorted.map((signal, i) => (
          <motion.div
            key={`${signal.indicator}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 bg-surface2 rounded-lg p-3"
          >
            <div className="flex-shrink-0 mt-0.5">
              <SignalBadge signal={signal.signal} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200">{signal.indicator}</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{signal.detail}</p>
            </div>
            <div className={cn(
              'text-xs font-bold flex-shrink-0',
              signal.score > 0 ? 'text-trade-buy' : signal.score < 0 ? 'text-trade-sell' : 'text-muted'
            )}>
              {signal.score > 0 ? '+' : ''}{signal.score.toFixed(1)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

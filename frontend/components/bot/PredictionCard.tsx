'use client';
import { motion } from 'framer-motion';
import type { Prediction } from '@/types';
import { formatPrice, getConfidenceColor, cn } from '@/lib/utils';

function ConfidenceArc({ confidence, color }: { confidence: number; color: string }) {
  const r = 40;
  const circumference = Math.PI * r; // Half circle
  const strokeDash = (confidence / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(42,42,61,0.8)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <span className="text-2xl font-bold" style={{ color }}>{confidence.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const directionConfig = {
    BUY: { color: '#10B981', bg: 'bg-trade-buy/20', border: 'border-trade-buy/30', label: 'BUY' },
    SELL: { color: '#EF4444', bg: 'bg-trade-sell/20', border: 'border-trade-sell/30', label: 'SELL' },
    WAIT: { color: '#6366F1', bg: 'bg-trade-neutral/20', border: 'border-trade-neutral/30', label: 'WAIT' },
  };
  const config = directionConfig[prediction.direction];
  const confColor = getConfidenceColor(prediction.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-surface rounded-2xl border border-border p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{prediction.pair}</h3>
          <p className="text-xs text-muted">{prediction.timeframe} timeframe</p>
        </div>
        <motion.div
          animate={{ boxShadow: [`0 0 10px ${config.color}40`, `0 0 25px ${config.color}80`, `0 0 10px ${config.color}40`] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn('px-4 py-2 rounded-xl border font-bold text-lg', config.bg, config.border)}
          style={{ color: config.color }}
        >
          {config.label}
        </motion.div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-1">Confidence</p>
          <p className="text-sm font-semibold" style={{ color: confColor }}>
            {prediction.confidence_label}
          </p>
        </div>
        <ConfidenceArc confidence={prediction.confidence} color={confColor} />
      </div>

      {/* Price Levels */}
      <div className="bg-surface2 rounded-xl p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Entry</span>
          <span className="font-mono font-semibold text-slate-100">{formatPrice(prediction.entry_price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-red-400">Stop Loss</span>
          <span className="font-mono text-red-400">{formatPrice(prediction.stop_loss)}</span>
        </div>
        <div className="border-t border-border pt-2 space-y-1.5">
          {[
            { label: 'TP1 (1.5R)', value: prediction.take_profit_1 },
            { label: 'TP2 (2.5R)', value: prediction.take_profit_2 },
            { label: 'TP3 (4R)', value: prediction.take_profit_3 },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-trade-buy">{label}</span>
              <span className="font-mono text-trade-buy">{formatPrice(value)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs pt-1 border-t border-border">
          <span className="text-muted">Risk/Reward</span>
          <span className="text-gold font-semibold">1:{prediction.rr_ratio.toFixed(1)}</span>
        </div>
      </div>

      {/* Signal Counts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-trade-buy/10 rounded-lg p-2 text-center">
          <div className="text-trade-buy font-bold text-lg">{prediction.signal_counts.buy}</div>
          <div className="text-xs text-muted">Buy</div>
        </div>
        <div className="bg-trade-neutral/10 rounded-lg p-2 text-center">
          <div className="text-trade-neutral font-bold text-lg">{prediction.signal_counts.neutral}</div>
          <div className="text-xs text-muted">Neutral</div>
        </div>
        <div className="bg-trade-sell/10 rounded-lg p-2 text-center">
          <div className="text-trade-sell font-bold text-lg">{prediction.signal_counts.sell}</div>
          <div className="text-xs text-muted">Sell</div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface2/60 rounded-xl p-3">
        <p className="text-xs text-muted leading-relaxed">{prediction.analysis_summary}</p>
      </div>
    </motion.div>
  );
}

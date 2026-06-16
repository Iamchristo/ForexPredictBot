'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { tradingApi } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import type { TradeHistory, Signal } from '@/types';

type FilterType = 'ALL' | 'BUY' | 'SELL' | 'WAIT';

export default function HistoryPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    tradingApi.getHistory({ limit: 100 }).then(r => {
      setTrades(r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? trades : trades.filter(t => t.direction === filter);

  const filterButtons: FilterType[] = ['ALL', 'BUY', 'SELL', 'WAIT'];

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader title="Trade History" showBack />

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filterButtons.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all border',
                filter === f
                  ? f === 'BUY' ? 'bg-trade-buy/20 text-trade-buy border-trade-buy/30' :
                    f === 'SELL' ? 'bg-trade-sell/20 text-trade-sell border-trade-sell/30' :
                    'bg-gold/20 text-gold border-gold/30'
                  : 'bg-surface border-border text-muted hover:text-slate-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Trade count */}
        <p className="text-xs text-muted px-1">{filtered.length} analysis{filtered.length !== 1 ? 'es' : ''}</p>

        {/* Trade list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-border rounded w-1/3 mb-2" />
                <div className="h-3 bg-border rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={48} className="text-border mx-auto mb-3" />
            <p className="text-muted font-medium">No analyses found</p>
            <p className="text-sm text-muted mt-1">
              {filter === 'ALL' ? 'Run your first analysis to see it here' : `No ${filter} signals found`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((trade, i) => {
                const signals: Signal[] = (() => {
                  try { return trade.signals_json ? JSON.parse(trade.signals_json) : []; }
                  catch { return []; }
                })();
                const isExpanded = expandedId === trade.id;

                return (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    className="bg-surface rounded-xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                        trade.direction === 'BUY' ? 'bg-trade-buy/20 text-trade-buy' :
                        trade.direction === 'SELL' ? 'bg-trade-sell/20 text-trade-sell' :
                        'bg-trade-neutral/20 text-trade-neutral'
                      )}>
                        {trade.direction}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-100">{trade.pair}</span>
                          <span className="text-xs text-muted bg-surface2 px-1.5 py-0.5 rounded-md">{trade.timeframe}</span>
                          <span className="text-xs text-muted bg-surface2 px-1.5 py-0.5 rounded-md capitalize">{trade.market}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={10} className="text-muted" />
                          <span className="text-xs text-muted">{formatDateTime(trade.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <div>
                          <p className={cn('text-sm font-bold',
                            trade.confidence >= 70 ? 'text-trade-buy' :
                            trade.confidence >= 55 ? 'text-gold' : 'text-muted'
                          )}>
                            {trade.confidence.toFixed(0)}%
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-3 space-y-3">
                            {/* Price levels */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-surface2 rounded-lg p-2">
                                <p className="text-muted mb-1">Entry</p>
                                <p className="font-mono font-bold text-slate-100">{formatPrice(trade.entry_price)}</p>
                              </div>
                              <div className="bg-surface2 rounded-lg p-2">
                                <p className="text-red-400 mb-1">Stop Loss</p>
                                <p className="font-mono font-bold text-red-400">{formatPrice(trade.stop_loss)}</p>
                              </div>
                              <div className="bg-surface2 rounded-lg p-2">
                                <p className="text-trade-buy mb-1">TP1</p>
                                <p className="font-mono font-bold text-trade-buy">{formatPrice(trade.take_profit_1)}</p>
                              </div>
                              <div className="bg-surface2 rounded-lg p-2">
                                <p className="text-trade-buy mb-1">TP2</p>
                                <p className="font-mono font-bold text-trade-buy">{formatPrice(trade.take_profit_2)}</p>
                              </div>
                            </div>

                            {/* Signals preview */}
                            {signals.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted font-medium">Signals ({signals.length})</p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {signals.slice(0, 5).map((sig, j) => (
                                    <div key={j} className="flex items-center gap-2 text-xs">
                                      <span className={cn(
                                        'px-1.5 py-0.5 rounded text-xs font-bold',
                                        sig.signal === 'BUY' ? 'bg-trade-buy/20 text-trade-buy' :
                                        sig.signal === 'SELL' ? 'bg-trade-sell/20 text-trade-sell' :
                                        'bg-muted/20 text-muted'
                                      )}>
                                        {sig.signal}
                                      </span>
                                      <span className="text-muted truncate">{sig.indicator}</span>
                                    </div>
                                  ))}
                                  {signals.length > 5 && (
                                    <p className="text-xs text-muted">+{signals.length - 5} more signals</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

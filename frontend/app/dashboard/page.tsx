'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Zap, Crown, ChevronRight } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Logo } from '@/components/layout/Logo';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useAuth } from '@/hooks/useAuth';
import { tradingApi, subscriptionsApi } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import type { TradeHistory } from '@/types';

const marketPreviews = [
  { pair: 'EUR/USD', price: '1.08542', change: '+0.12%', up: true },
  { pair: 'BTC/USD', price: '67,234', change: '+2.4%', up: true },
  { pair: 'XAU/USD', price: '2,312.5', change: '-0.3%', up: false },
  { pair: 'S&P 500', price: '5,248', change: '+0.8%', up: true },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentTrades, setRecentTrades] = useState<TradeHistory[]>([]);
  const [planName, setPlanName] = useState('Free');
  const [analysisCount, setAnalysisCount] = useState(0);
  const [maxAnalyses, setMaxAnalyses] = useState(5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'Trader';

  useEffect(() => {
    tradingApi.getHistory({ limit: 3 }).then(r => {
      setRecentTrades(r.data || []);
      // Count today's analyses
      const today = new Date().toDateString();
      const todayCount = (r.data || []).filter(
        (t: TradeHistory) => new Date(t.created_at).toDateString() === today
      ).length;
      setAnalysisCount(todayCount);
    }).catch(() => {});

    subscriptionsApi.getMy().then(r => {
      if (r.data?.plan) {
        setPlanName(r.data.plan.name);
        setMaxAnalyses(r.data.plan.max_analyses_per_day === -1 ? 999 : r.data.plan.max_analyses_per_day);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">{greeting},</p>
            <h1 className="text-xl font-bold text-slate-100">{firstName} 👋</h1>
          </div>
          <Logo size="sm" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Subscription badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between p-3 rounded-xl border',
            planName === 'Free'
              ? 'bg-border/30 border-border'
              : planName === 'Pro'
              ? 'bg-gold/10 border-gold/30'
              : 'bg-indigo-500/10 border-indigo-500/30'
          )}
        >
          <div className="flex items-center gap-2">
            <Crown size={16} className={planName === 'Free' ? 'text-muted' : 'text-gold'} />
            <span className="text-sm font-semibold text-slate-200">{planName} Plan</span>
          </div>
          {planName === 'Free' && (
            <Link href="/dashboard/subscription">
              <span className="text-xs text-gold font-medium hover:underline">Upgrade →</span>
            </Link>
          )}
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today', value: `${analysisCount}/${maxAnalyses === 999 ? '∞' : maxAnalyses}`, sublabel: 'Analyses' },
            { label: 'Win Rate', value: '67%', sublabel: 'Last 30 signals' },
            { label: 'Streak', value: '5 🔥', sublabel: 'Days active' },
          ].map(({ label, value, sublabel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface rounded-xl border border-border p-3 text-center"
            >
              <p className="text-lg font-bold text-slate-100">{value}</p>
              <p className="text-xs text-muted mt-0.5">{sublabel}</p>
            </motion.div>
          ))}
        </div>

        {/* Market Overview */}
        <div>
          <h2 className="text-sm font-semibold text-muted mb-2 px-1">Market Overview</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {marketPreviews.map(({ pair, price, change, up }, i) => (
              <motion.div
                key={pair}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 bg-surface rounded-xl border border-border p-3 w-36"
              >
                <p className="text-xs text-muted">{pair}</p>
                <p className="text-base font-bold text-slate-100 mt-0.5">{price}</p>
                <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', up ? 'text-trade-buy' : 'text-trade-sell')}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {change}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* New Analysis CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/dashboard/trade">
            <ShimmerButton className="w-full py-4 text-base font-bold justify-center flex items-center gap-2" size="lg">
              <Zap size={18} fill="currentColor" />
              Start New Analysis
            </ShimmerButton>
          </Link>
        </motion.div>

        {/* Recent Trades */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-semibold text-muted">Recent Analyses</h2>
            <Link href="/dashboard/history" className="text-xs text-gold hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {recentTrades.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-6 text-center">
              <TrendingUp size={32} className="text-border mx-auto mb-2" />
              <p className="text-sm text-muted">No analyses yet</p>
              <p className="text-xs text-muted mt-1">Start your first analysis above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade, i) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                    trade.direction === 'BUY' ? 'bg-trade-buy/20 text-trade-buy' :
                    trade.direction === 'SELL' ? 'bg-trade-sell/20 text-trade-sell' :
                    'bg-trade-neutral/20 text-trade-neutral'
                  )}>
                    {trade.direction}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100">{trade.pair}</p>
                      <span className="text-xs text-muted">{trade.timeframe}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDateTime(trade.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-bold',
                      trade.confidence >= 70 ? 'text-trade-buy' :
                      trade.confidence >= 55 ? 'text-gold' : 'text-muted'
                    )}>
                      {trade.confidence.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted">confidence</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

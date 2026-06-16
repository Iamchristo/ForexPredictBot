'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Zap, Globe, Shield, Check, Star } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { SparklesText } from '@/components/ui/sparkles';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { MovingBorder } from '@/components/ui/moving-border';
import { Logo } from '@/components/layout/Logo';

const features = [
  { icon: TrendingUp, title: '10+ Indicators', desc: 'EMA, RSI, MACD, Bollinger Bands, Stochastic, ADX, ATR, OBV and more' },
  { icon: Globe, title: 'Multi-Market', desc: 'Forex, Crypto, Commodities, and Global Stock Indices' },
  { icon: Zap, title: 'Real-Time Data', desc: 'Live market data powered by yFinance with instant analysis' },
  { icon: Shield, title: 'Risk Management', desc: 'ATR-based stop loss and take profit levels with R:R ratios' },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['5 analyses per day', 'Basic indicators', 'Forex & Crypto', 'Email support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    features: ['Unlimited analyses', 'AI chat assistant', 'All indicators', 'All markets', 'Priority support'],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    name: 'Elite',
    price: '$49.99',
    period: '/month',
    features: ['Everything in Pro', 'Advanced ML signals', 'Custom alerts', 'API access', 'Account manager'],
    cta: 'Go Elite',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-slate-100 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register">
              <ShimmerButton size="sm">Get Started</ShimmerButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <BackgroundBeams />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 text-sm text-gold font-medium mb-6"
          >
            <Star size={14} fill="currentColor" />
            AI-Powered Trading Intelligence
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
            <SparklesText className="block">
              <span className="gold-text">Precision Trading</span>
            </SparklesText>
            <span className="text-slate-100">Intelligence</span>
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            AI-powered predictions for Forex, Crypto, Commodities &amp; Indices.
            Trade smarter with 10+ technical indicators, real-time signals, and intelligent risk management.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <ShimmerButton size="lg" className="w-full sm:w-auto min-w-[180px]">
                Get Started Free
              </ShimmerButton>
            </Link>
            <Link href="/login">
              <button className="w-full sm:w-auto min-w-[180px] px-8 py-4 border border-border rounded-2xl text-slate-300 font-semibold hover:border-gold/50 hover:text-gold transition-all duration-200">
                Sign In
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-center">
            {[
              { value: '10+', label: 'Indicators' },
              { value: '4', label: 'Markets' },
              { value: '40+', label: 'Pairs' },
              { value: '10', label: 'Timeframes' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold gold-text">{value}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating chart preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 mt-12 w-full max-w-sm mx-auto"
        >
          <div className="glass rounded-2xl p-4 border border-gold/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted">EUR/USD &bull; 1H</p>
                <p className="text-lg font-bold text-slate-100">1.08542</p>
              </div>
              <motion.div
                animate={{ boxShadow: ['0 0 10px #10B98140', '0 0 25px #10B98180', '0 0 10px #10B98140'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-1.5 bg-trade-buy/20 border border-trade-buy/30 rounded-lg text-trade-buy font-bold text-sm"
              >
                BUY 87%
              </motion.div>
            </div>
            {/* Mock chart bars */}
            <div className="flex items-end gap-0.5 h-16">
              {[30, 45, 35, 55, 40, 60, 50, 70, 55, 80, 65, 75, 60, 85, 70].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                  className={`flex-1 rounded-sm ${i % 3 === 0 ? 'bg-trade-sell' : 'bg-trade-buy'}`}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface2 rounded-lg py-1.5">
                <div className="text-xs text-trade-buy font-bold">8 BUY</div>
              </div>
              <div className="bg-surface2 rounded-lg py-1.5">
                <div className="text-xs text-muted font-bold">2 NEUTRAL</div>
              </div>
              <div className="bg-surface2 rounded-lg py-1.5">
                <div className="text-xs text-trade-sell font-bold">2 SELL</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
              Everything You Need to Trade Smarter
            </h2>
            <p className="text-muted">Professional-grade analysis in the palm of your hand</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <CardSpotlight className="p-5 h-full">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-100 mb-1">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted">Choose the plan that matches your trading needs</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map(({ name, price, period, features: planFeatures, cta, highlight }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {highlight ? (
                  <MovingBorder containerClassName="h-full" className="p-5 h-full flex flex-col">
                    <PlanContent name={name} price={price} period={period} features={planFeatures} cta={cta} highlight />
                  </MovingBorder>
                ) : (
                  <div className="bg-surface rounded-2xl border border-border p-5 h-full flex flex-col">
                    <PlanContent name={name} price={price} period={period} features={planFeatures} cta={cta} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PWA Install */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-3">Install on Android</h2>
            <p className="text-muted mb-6">
              Add ForexPredictBot AI to your home screen for a native app experience.
              Open in Chrome &rarr; Menu &rarr; &ldquo;Add to Home Screen&rdquo;
            </p>
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-xl px-5 py-3 text-sm text-muted">
              <span>Chrome</span>
              <span className="text-border">&rarr;</span>
              <span>&#8942; Menu</span>
              <span className="text-border">&rarr;</span>
              <span className="text-gold">Add to Home Screen</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} ForexPredictBot AI. For educational purposes only.
          </p>
          <div className="flex gap-4 text-xs text-muted">
            <Link href="/login" className="hover:text-gold transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-gold transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlanContent({ name, price, period, features, cta, highlight = false }: any) {
  return (
    <>
      {highlight && (
        <div className="inline-block bg-gold/20 border border-gold/30 rounded-full px-3 py-1 text-xs text-gold font-semibold mb-3">
          Most Popular
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-100">{name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-3xl font-black ${highlight ? 'gold-text' : 'text-slate-100'}`}>{price}</span>
          <span className="text-muted text-sm">{period}</span>
        </div>
      </div>
      <ul className="space-y-2 flex-1 mb-5">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
            <Check size={14} className={highlight ? 'text-gold' : 'text-trade-buy'} />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/register">
        {highlight ? (
          <ShimmerButton className="w-full justify-center text-center">{cta}</ShimmerButton>
        ) : (
          <button className="w-full py-2.5 border border-border rounded-xl text-sm text-slate-300 hover:border-gold/50 hover:text-gold transition-all">
            {cta}
          </button>
        )}
      </Link>
    </>
  );
}

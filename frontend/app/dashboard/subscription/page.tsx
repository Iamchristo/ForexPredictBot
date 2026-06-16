'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star, Clock } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MovingBorder } from '@/components/ui/moving-border';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { subscriptionsApi } from '@/lib/api';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { Subscription, UserSubscription, Transaction } from '@/types';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [currentSub, setCurrentSub] = useState<{ subscription: UserSubscription | null; plan: Subscription | null }>({ subscription: null, plan: null });
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    Promise.all([
      subscriptionsApi.getPlans(),
      subscriptionsApi.getMy(),
    ]).then(([plansRes, myRes]) => {
      setPlans(plansRes.data || []);
      setCurrentSub(myRes.data || { subscription: null, plan: null });
    }).catch(() => {});
  }, []);

  const handleSubscribe = async (planId: number) => {
    setSubscribing(planId);
    try {
      await subscriptionsApi.subscribe({ plan_id: planId, billing_cycle: billingCycle });
      const myRes = await subscriptionsApi.getMy();
      setCurrentSub(myRes.data);
      alert('Subscription activated! (Demo - no real payment)');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until the end of your billing period.')) return;
    try {
      await subscriptionsApi.cancel();
      const myRes = await subscriptionsApi.getMy();
      setCurrentSub(myRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  const isCurrentPlan = (planId: number) => currentSub.plan?.id === planId;

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader title="Subscription" showBack />

      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Current Plan */}
        {currentSub.plan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown size={16} className="text-gold" />
              <span className="text-sm font-semibold text-slate-100">Current Plan</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold gold-text">{currentSub.plan.name}</p>
                {currentSub.subscription?.expires_at && (
                  <p className="text-xs text-muted mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    Expires {formatDate(currentSub.subscription.expires_at)}
                  </p>
                )}
              </div>
              {currentSub.subscription?.status === 'active' && currentSub.plan.name !== 'Free' && (
                <button onClick={handleCancel} className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
                  Cancel
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentSub.plan.features.slice(0, 3).map(f => (
                <span key={f} className="text-xs bg-surface2 border border-border rounded-full px-2.5 py-1 text-muted">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', billingCycle === 'monthly' ? 'bg-gold text-bg' : 'text-muted hover:text-slate-300')}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1', billingCycle === 'yearly' ? 'bg-gold text-bg' : 'text-muted hover:text-slate-300')}
          >
            Yearly
            <span className="bg-trade-buy/20 text-trade-buy text-xs px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan, i) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
            const isPro = plan.name === 'Pro';
            const isCurrent = isCurrentPlan(plan.id);

            const CardContent = (
              <div className="p-4 space-y-4">
                {isPro && !isCurrent && (
                  <div className="inline-block bg-gold/20 border border-gold/30 rounded-full px-3 py-1 text-xs text-gold font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={cn('text-3xl font-black', isPro ? 'gold-text' : 'text-slate-100')}>
                        {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                      </span>
                      {price > 0 && <span className="text-muted text-sm">/month</span>}
                    </div>
                    {billingCycle === 'yearly' && price > 0 && (
                      <p className="text-xs text-muted mt-0.5">Billed ${plan.price_yearly}/year</p>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="bg-trade-buy/20 border border-trade-buy/30 rounded-lg px-2 py-1 text-xs text-trade-buy font-bold">
                      Active
                    </div>
                  )}
                </div>

                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className={isPro ? 'text-gold' : 'text-trade-buy'} />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent ? (
                  isPro ? (
                    <ShimmerButton
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                      className="w-full justify-center"
                    >
                      {subscribing === plan.id ? 'Processing...' : `Get ${plan.name}`}
                    </ShimmerButton>
                  ) : (
                    <button
                      onClick={() => plan.price_monthly > 0 && handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id || plan.price_monthly === 0}
                      className={cn(
                        'w-full py-3 rounded-xl text-sm font-semibold border transition-all',
                        plan.price_monthly === 0
                          ? 'border-border text-muted cursor-default'
                          : 'border-border text-slate-300 hover:border-gold/50 hover:text-gold'
                      )}
                    >
                      {plan.price_monthly === 0 ? 'Current Free Tier' : subscribing === plan.id ? 'Processing...' : `Get ${plan.name}`}
                    </button>
                  )
                ) : (
                  <div className="py-2 text-center text-sm text-trade-buy font-medium">
                    ✓ Your current plan
                  </div>
                )}
              </div>
            );

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {isPro && !isCurrent ? (
                  <MovingBorder>{CardContent}</MovingBorder>
                ) : (
                  <div className="bg-surface rounded-2xl border border-border">
                    {CardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs text-muted text-center px-4 leading-relaxed">
          Demo app - no real payments are processed. Upgrading just demonstrates the subscription flow.
        </p>
      </div>
    </div>
  );
}

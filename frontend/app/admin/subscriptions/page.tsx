'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, ToggleLeft, ToggleRight, Crown, Check } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { formatCurrency, cn } from '@/lib/utils';

interface Plan {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_analyses_per_day: number;
  has_ai_chat: boolean;
  has_advanced_indicators: boolean;
  is_active: boolean;
}

function PlanModal({ plan, onClose, onSave }: { plan: Partial<Plan> | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    price_monthly: plan?.price_monthly ?? 0,
    price_yearly: plan?.price_yearly ?? 0,
    max_analyses_per_day: plan?.max_analyses_per_day ?? 5,
    has_ai_chat: plan?.has_ai_chat ?? false,
    has_advanced_indicators: plan?.has_advanced_indicators ?? false,
    features: (plan?.features ?? []).join('\n'),
    is_active: plan?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      price_monthly: Number(form.price_monthly),
      price_yearly: Number(form.price_yearly),
      max_analyses_per_day: Number(form.max_analyses_per_day),
      features: form.features.split('\n').filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-100">{plan?.id ? 'Edit Plan' : 'Create Plan'}</h3>
          <button onClick={onClose} className="text-muted hover:text-slate-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted block mb-1.5">Plan Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required placeholder="e.g. Pro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1.5">Monthly Price ($)</label>
              <input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: e.target.value as any }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1.5">Yearly Price ($)</label>
              <input type="number" step="0.01" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: e.target.value as any }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Max Analyses/Day (-1 = unlimited)</label>
            <input type="number" value={form.max_analyses_per_day} onChange={e => setForm(f => ({ ...f, max_analyses_per_day: e.target.value as any }))} className="input-field" />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              className="input-field h-28 resize-none"
              placeholder="Unlimited analyses&#10;AI chat assistant&#10;All markets"
            />
          </div>
          <div className="space-y-3">
            {[
              { key: 'has_ai_chat', label: 'AI Chat Enabled' },
              { key: 'has_advanced_indicators', label: 'Advanced Indicators' },
              { key: 'is_active', label: 'Plan Active' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                  className={cn('w-11 h-6 rounded-full relative transition-colors cursor-pointer', (form as any)[key] ? 'bg-gold' : 'bg-border')}
                >
                  <div className={cn('w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-transform', (form as any)[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
                <span className="text-sm text-slate-200">{label}</span>
              </label>
            ))}
          </div>
          <ShimmerButton type="submit" className="w-full justify-center" size="md">
            {plan?.id ? 'Save Changes' : 'Create Plan'}
          </ShimmerButton>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalPlan, setModalPlan] = useState<Partial<Plan> | null | false>(false);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSubscriptionPlans();
      setPlans(res.data?.plans || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async (data: any) => {
    try {
      if ((modalPlan as Plan)?.id) {
        await adminApi.updatePlan((modalPlan as Plan).id, data);
      } else {
        await adminApi.createPlan(data);
      }
      setModalPlan(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save plan');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Subscription Plans</h1>
          <p className="text-muted text-sm mt-1">{plans.length} plans configured</p>
        </div>
        <ShimmerButton size="sm" onClick={() => setModalPlan({})}>
          <Plus size={16} className="mr-1" /> New Plan
        </ShimmerButton>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'bg-surface rounded-xl border p-5 space-y-4',
                plan.is_active ? 'border-border' : 'border-border/40 opacity-70'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown size={16} className={plan.is_active ? 'text-gold' : 'text-muted'} />
                    <h3 className="font-bold text-slate-100">{plan.name}</h3>
                  </div>
                  <p className="text-2xl font-black text-slate-100 mt-1">
                    {plan.price_monthly === 0 ? 'Free' : `$${plan.price_monthly}/mo`}
                  </p>
                  {plan.price_monthly > 0 && (
                    <p className="text-xs text-muted">${plan.price_yearly}/yr</p>
                  )}
                </div>
                <div className={cn('px-2 py-1 rounded-lg text-xs font-bold border', plan.is_active ? 'bg-trade-buy/20 text-trade-buy border-trade-buy/30' : 'bg-border/40 text-muted border-border')}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <ul className="space-y-1.5">
                {plan.features.slice(0, 4).map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check size={12} className="text-gold flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-xs text-muted">+{plan.features.length - 4} more</li>
                )}
              </ul>

              <div className="space-y-1 text-xs text-muted">
                <p>Daily limit: {plan.max_analyses_per_day === -1 ? 'Unlimited' : plan.max_analyses_per_day}</p>
                <p>AI Chat: {plan.has_ai_chat ? '✓' : '✗'}</p>
              </div>

              <button
                onClick={() => setModalPlan(plan)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-xl text-sm text-muted hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Edit2 size={14} /> Edit Plan
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalPlan !== false && (
          <PlanModal
            plan={modalPlan || {}}
            onClose={() => setModalPlan(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

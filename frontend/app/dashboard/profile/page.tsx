'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Shield, Bell, LogOut, Crown, Camera } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useAuth } from '@/hooks/useAuth';
import { usersApi, subscriptionsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, logout, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [planName, setPlanName] = useState('Free');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  useEffect(() => {
    reset({ name: user?.name ?? '', phone: user?.phone ?? '' });
    subscriptionsApi.getMy().then(r => {
      if (r.data?.plan) setPlanName(r.data.plan.name);
    }).catch(() => {});
  }, [user, reset]);

  const onSave = async (data: any) => {
    setSaving(true);
    try {
      await usersApi.updateProfile(data);
      await checkAuth();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    try {
      await usersApi.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete account');
    }
  };

  const statusColor = user?.status === 'active' ? 'text-trade-buy bg-trade-buy/10 border-trade-buy/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader title="Profile" showBack />

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center text-3xl font-black text-gold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
              <Camera size={14} className="text-bg" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-3">{user?.name}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border', statusColor)}>
              {user?.status}
            </span>
            <span className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border',
              planName !== 'Free' ? 'bg-gold/15 text-gold border-gold/25' : 'bg-border/40 text-muted border-border'
            )}>
              <Crown size={10} className="inline mr-1" />
              {planName}
            </span>
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-slate-200">Personal Info</span>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-xs text-gold hover:underline">Edit</button>
            ) : (
              <button onClick={() => setEditing(false)} className="text-xs text-muted hover:text-slate-300">Cancel</button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSave)} className="p-4 space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Full Name</label>
                <input {...register('name')} className="input-field" placeholder="Full Name" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Phone</label>
                <input {...register('phone')} className="input-field" placeholder="+1 234 567 8900" />
              </div>
              <ShimmerButton type="submit" disabled={saving} className="w-full justify-center" size="md">
                {saving ? 'Saving...' : 'Save Changes'}
              </ShimmerButton>
              {saved && <p className="text-xs text-trade-buy text-center">Changes saved!</p>}
            </form>
          ) : (
            <div className="p-4 space-y-3">
              {[
                { icon: User, label: 'Name', value: user?.name },
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
                { icon: Shield, label: 'Role', value: user?.role },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={16} className="text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">{label}</p>
                    <p className="text-sm text-slate-200">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notification Preferences (mock toggles) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
          </div>
          {[
            { label: 'Analysis Alerts', desc: 'Get notified when analysis completes', on: true },
            { label: 'Market Updates', desc: 'Daily market summary', on: false },
            { label: 'Subscription', desc: 'Billing & renewal reminders', on: true },
          ].map(({ label, desc, on }, i) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-slate-200">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <div className={cn(
                'w-11 h-6 rounded-full relative cursor-pointer transition-colors',
                on ? 'bg-gold' : 'bg-border'
              )}>
                <div className={cn(
                  'w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-transform',
                  on ? 'translate-x-5' : 'translate-x-0.5'
                )} style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full text-xs text-muted hover:text-red-400 transition-colors py-2"
          >
            Delete Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}

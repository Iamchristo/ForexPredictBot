'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '@/components/admin/StatsCard';
import { UserTable } from '@/components/admin/UserTable';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import type { AdminStats, User, Transaction } from '@/types';

const mockUserGrowth = [
  { date: 'Jan', users: 12 }, { date: 'Feb', users: 19 }, { date: 'Mar', users: 28 },
  { date: 'Apr', users: 35 }, { date: 'May', users: 52 }, { date: 'Jun', users: 67 },
];

const mockRevenue = [
  { date: 'Jan', revenue: 240 }, { date: 'Feb', revenue: 380 }, { date: 'Mar', revenue: 520 },
  { date: 'Apr', revenue: 690 }, { date: 'May', revenue: 840 }, { date: 'Jun', revenue: 1020 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getUsers({ limit: 5 }),
      adminApi.getTransactions({ limit: 5 }),
    ]).then(([statsRes, usersRes, txRes]) => {
      setStats(statsRes.data);
      setRecentUsers(usersRes.data?.users || []);
      setRecentTransactions(txRes.data?.transactions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: <Users size={18} />, color: '#6366F1', trend: { value: stats.new_users_today, label: `+${stats.new_users_today} today` } },
    { label: 'Active Subscriptions', value: stats.active_subscriptions, icon: <Crown size={18} />, color: '#F59E0B' },
    { label: 'Monthly Revenue', value: formatCurrency(stats.monthly_revenue), icon: <DollarSign size={18} />, color: '#10B981' },
    { label: 'Trades Today', value: stats.total_trades_today, icon: <TrendingUp size={18} />, color: '#EF4444' },
  ] : [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-muted text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-4 h-24 animate-pulse" />
          ))
        ) : (
          statCards.map((card, i) => (
            <StatsCard key={card.label} {...card} index={i} />
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-xl border border-border p-4"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockUserGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#12121A', border: '1px solid #2A2A3D', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#6366F1" fill="url(#userGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface rounded-xl border border-border p-4"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue (USD)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#12121A', border: '1px solid #2A2A3D', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-surface rounded-xl border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-slate-200">Recent Users</h3>
          <a href="/admin/users" className="text-xs text-gold hover:underline">View all</a>
        </div>
        <UserTable users={recentUsers} />
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-surface rounded-xl border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-slate-200">Recent Transactions</h3>
          <a href="/admin/transactions" className="text-xs text-gold hover:underline">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-xs">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-muted text-xs">No transactions yet</td></tr>
              ) : (
                recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface/50">
                    <td className="py-3 px-4 font-mono text-xs text-muted">#{tx.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-medium border',
                        tx.status === 'completed' ? 'bg-trade-buy/20 text-trade-buy border-trade-buy/30' :
                        tx.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' :
                        tx.status === 'failed' ? 'bg-trade-sell/20 text-trade-sell border-trade-sell/30' :
                        'bg-blue-400/20 text-blue-400 border-blue-400/30'
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted text-xs hidden sm:table-cell">{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

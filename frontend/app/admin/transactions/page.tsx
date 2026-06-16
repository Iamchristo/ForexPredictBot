'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { Transaction } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    completed: 'bg-trade-buy/20 text-trade-buy border-trade-buy/30',
    pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
    failed: 'bg-trade-sell/20 text-trade-sell border-trade-sell/30',
    refunded: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium border', cls[status] ?? 'bg-border/40 text-muted border-border')}>
      {status}
    </span>
  );
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchTx = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions({ skip: page * limit, limit });
      setTransactions(res.data?.transactions || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchTx(); }, [page]);

  const filtered = statusFilter ? transactions.filter(t => t.status === statusFilter) : transactions;

  const exportCsv = () => {
    const headers = ['ID', 'User ID', 'Amount', 'Currency', 'Status', 'Method', 'Ref', 'Date'];
    const rows = filtered.map(t => [t.id, t.user_id, t.amount, t.currency, t.status, t.payment_method ?? '', t.payment_ref ?? '', t.created_at]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transactions</h1>
          <p className="text-muted text-sm mt-1">{filtered.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTx} className="p-2 text-muted hover:text-slate-100 rounded-lg hover:bg-surface2 transition-colors border border-border">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted hover:text-gold hover:border-gold/40 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'completed', 'pending', 'failed', 'refunded'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              statusFilter === s
                ? 'bg-gold/20 text-gold border-gold/30'
                : 'border-border text-muted hover:text-slate-300'
            )}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-xs">
                <th className="text-left py-3 px-4 font-medium">ID</th>
                <th className="text-left py-3 px-4 font-medium">User</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Method</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-border/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted text-sm">No transactions found</td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted">#{tx.id}</td>
                    <td className="py-3 px-4 text-slate-300">User #{tx.user_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4"><StatusBadge status={tx.status} /></td>
                    <td className="py-3 px-4 text-muted text-xs hidden sm:table-cell">{tx.payment_method ?? '-'}</td>
                    <td className="py-3 px-4 text-muted text-xs hidden md:table-cell">{formatDateTime(tx.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className="px-4 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-slate-100 disabled:opacity-40">
          Prev
        </button>
        <span className="text-sm text-muted">Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={transactions.length < limit}
          className="px-4 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-slate-100 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

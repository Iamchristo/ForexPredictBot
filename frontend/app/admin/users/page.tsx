'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, RefreshCw } from 'lucide-react';
import { UserTable } from '@/components/admin/UserTable';
import { adminApi } from '@/lib/api';
import { tokenStorage } from '@/lib/auth';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ skip: page * limit, limit, search: search || undefined, status: statusFilter || undefined });
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
    } catch { } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSuspend = async (id: number) => {
    if (!confirm('Suspend this user?')) return;
    await adminApi.suspendUser(id);
    fetchUsers();
  };

  const handleActivate = async (id: number) => {
    await adminApi.activateUser(id);
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    await adminApi.deleteUser(id);
    fetchUsers();
  };

  const handleImpersonate = async (id: number) => {
    try {
      const res = await adminApi.impersonateUser(id);
      const { access_token, user } = res.data;
      // Save current admin token, set impersonation token
      const adminToken = tokenStorage.getToken();
      if (adminToken) tokenStorage.setAdminToken(adminToken);
      tokenStorage.setToken(access_token);
      tokenStorage.setImpersonating(true);
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Impersonation failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users</h1>
          <p className="text-muted text-sm mt-1">{total} total users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 text-muted hover:text-slate-100 rounded-lg hover:bg-surface2 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or email..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="input-field w-auto text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface rounded-xl border border-border overflow-hidden"
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-border/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <UserTable
            users={users}
            onSuspend={handleSuspend}
            onActivate={handleActivate}
            onDelete={handleDelete}
            onImpersonate={handleImpersonate}
          />
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-sm text-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

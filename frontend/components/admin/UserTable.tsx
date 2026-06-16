'use client';
import { motion } from 'framer-motion';
import type { User } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { MoreVertical, Shield, UserX, UserCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserTableProps {
  users: User[];
  onSuspend?: (id: number) => void;
  onActivate?: (id: number) => void;
  onDelete?: (id: number) => void;
  onImpersonate?: (id: number) => void;
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    active: 'bg-trade-buy/20 text-trade-buy border-trade-buy/30',
    suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    deleted: 'bg-trade-sell/20 text-trade-sell border-trade-sell/30',
  }[status] ?? 'bg-muted/20 text-muted';
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium border', cls)}>
      {status}
    </span>
  );
}

export function UserTable({ users, onSuspend, onActivate, onDelete, onImpersonate }: UserTableProps) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted text-xs">
            <th className="text-left py-3 px-3 font-medium">User</th>
            <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">Role</th>
            <th className="text-left py-3 px-3 font-medium">Status</th>
            <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Joined</th>
            <th className="text-right py-3 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user, i) => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="hover:bg-surface/50 transition-colors"
            >
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-xs">{user.name}</p>
                    <p className="text-muted text-xs">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 hidden sm:table-cell">
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-xs font-medium border',
                  user.role === 'admin' ? 'bg-gold/20 text-gold border-gold/30' : 'bg-border/50 text-muted border-border'
                )}>
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-3"><StatusBadge status={user.status} /></td>
              <td className="py-3 px-3 text-muted text-xs hidden md:table-cell">{formatDate(user.created_at)}</td>
              <td className="py-3 px-3 text-right relative">
                <button
                  onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                  className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-slate-300 transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
                {openMenu === user.id && (
                  <div className="absolute right-2 top-10 z-50 bg-surface border border-border rounded-xl shadow-xl py-1 w-44">
                    {onImpersonate && (
                      <button onClick={() => { onImpersonate(user.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-surface2 hover:text-gold transition-colors">
                        <Shield size={14} /> Impersonate
                      </button>
                    )}
                    {user.status === 'active' && onSuspend && (
                      <button onClick={() => { onSuspend(user.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-surface2 hover:text-yellow-400 transition-colors">
                        <UserX size={14} /> Suspend
                      </button>
                    )}
                    {user.status === 'suspended' && onActivate && (
                      <button onClick={() => { onActivate(user.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-surface2 hover:text-trade-buy transition-colors">
                        <UserCheck size={14} /> Activate
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => { onDelete(user.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">No users found</div>
      )}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Users, Crown, CreditCard, Settings, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart2, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Logo size="sm" />
        <div className="mt-3 px-2 py-1.5 bg-gold/10 rounded-lg">
          <p className="text-xs text-gold font-medium">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
                isActive
                  ? 'bg-gold/15 text-gold font-semibold'
                  : 'text-muted hover:text-slate-200 hover:bg-surface2'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-slate-200 hover:bg-surface2 transition-colors"
        >
          <TrendingUp size={18} />
          View Dashboard
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <div className="px-3 pt-1">
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
      </div>
    </aside>
  );
}

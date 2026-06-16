'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BarChart2, Users, Crown, CreditCard, Settings, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart2, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && user && !isAdmin) router.push('/dashboard');
  }, [isLoading, user, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 bg-surface border-r border-border">
            <div className="p-4 flex justify-end">
              <button onClick={() => setMobileNavOpen(false)} className="text-muted hover:text-slate-100 p-2">
                <X size={20} />
              </button>
            </div>
            <nav className="px-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                      isActive ? 'bg-gold/15 text-gold font-semibold' : 'text-muted hover:text-slate-200 hover:bg-surface2'
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface sticky top-0 z-40">
          <button onClick={() => setMobileNavOpen(true)} className="p-2 text-muted hover:text-slate-100 rounded-lg hover:bg-surface2">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-slate-100">Admin Panel</span>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

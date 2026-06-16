'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth, isImpersonating, exitImpersonation } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gold text-bg text-center text-xs py-2 font-semibold flex items-center justify-center gap-3">
          <span>Viewing as {user.name} (Impersonation Mode)</span>
          <button
            onClick={exitImpersonation}
            className="underline font-bold hover:no-underline"
          >
            Exit
          </button>
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 pb-20 ${isImpersonating ? 'pt-8' : ''}`}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

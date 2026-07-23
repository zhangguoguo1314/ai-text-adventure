'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      if (!user) {
        await fetchMe();
      }
      setChecking(false);
    };
    check();
  }, [isAuthenticated, user, fetchMe, router]);

  useEffect(() => {
    if (!checking && user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [checking, user, router]);

  if (checking || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    const role = Cookies.get('userRole');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (['SUPER_ADMIN', 'OWNER', 'TEACHER'].includes(role || '')) {
      router.replace('/admin');
    } else {
      router.replace('/questoes');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-sm">Redirecionando para seu ambiente...</p>
    </div>
  );
}
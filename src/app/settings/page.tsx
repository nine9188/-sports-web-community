'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      <span className="ml-2">리다이렉트 중...</span>
    </div>
  );
} 
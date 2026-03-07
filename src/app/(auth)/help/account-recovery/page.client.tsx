"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');

  useEffect(() => {
    if (tab === 'password') {
      router.replace('/help/find-password');
    } else {
      router.replace('/help/find-id');
    }
  }, [tab, router]);

  return null;
}

export default function AccountRecoveryRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}

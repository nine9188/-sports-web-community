'use client';

import { useMemo, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { IconProvider } from '@/shared/context/IconContext';
import { Toaster } from 'sonner';

const SuspensionPopup = lazy(() => import('@/shared/components/SuspensionPopup'));
const AttendanceChecker = lazy(() => import('@/shared/components/AttendanceChecker'));

// ReactQueryDevtools는 개발 환경에서만 lazy load
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(mod => ({
    default: mod.ReactQueryDevtools
  }))
);

/**
 * Root Layout Provider (Client Component)
 *
 * 모든 무해한 Provider들을 포함합니다.
 * 이 Provider들은 자체적으로 API를 호출하지 않습니다.
 */
export default function RootLayoutProvider({ children }: { children: React.ReactNode }) {
  // QueryClient 생성 (무해 - API 호출 안 함)
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 10, // 10분
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        notifyOnChangeProps: ['data', 'error', 'isLoading'],
        refetchInterval: false,
        structuralSharing: false,
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <IconProvider>
            {children}
            <Toaster
              position="top-right"
              duration={3000}
              visibleToasts={3}
              closeButton
              richColors
              toastOptions={{
                className: 'text-sm',
              }}
            />
            <Suspense fallback={null}>
              <SuspensionPopup />
              <AttendanceChecker />
            </Suspense>
          </IconProvider>
        </AuthProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

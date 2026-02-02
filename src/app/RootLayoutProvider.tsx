'use client';

import { useMemo, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { IconProvider } from '@/shared/context/IconContext';

// 초기 로딩에 필수적이지 않은 컴포넌트들을 lazy load
const ToastContainer = lazy(() =>
  import('react-toastify').then(mod => {
    // CSS도 함께 로드
    import('react-toastify/dist/ReactToastify.css');
    return { default: mod.ToastContainer };
  })
);

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

  // ToastContainer 설정
  const toastConfig = useMemo(() => ({
    position: "top-right" as const,
    autoClose: 3000,
    limit: 3,
    newestOnTop: true,
    closeOnClick: true,
    rtl: false,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true
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
            <Suspense fallback={null}>
              <ToastContainer {...toastConfig} />
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

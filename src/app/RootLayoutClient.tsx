'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import SidebarWrapper from './components/SidebarWrapper';
import RightSidebar from './components/RightSidebar';
import { ThemeProvider } from './components/ThemeProvider';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

// DevTools 동적 로드 - 개발 환경에서만 로드
const ReactQueryDevtools = dynamic(() => 
  process.env.NODE_ENV === 'development' 
    ? import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools) 
    : Promise.resolve(() => null),
  { ssr: false }
);

interface RootLayoutClientProps {
  children: React.ReactNode;
  boardNavigation: React.ReactNode;
}

export default function RootLayoutClient({ children, boardNavigation }: RootLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  
  // 인증 페이지 여부 확인 (로그인, 회원가입)
  const isAuthPage = useMemo(() => {
    return pathname === '/signin' || pathname === '/signup';
  }, [pathname]);
  
  // 쇼츠 페이지 여부 확인
  const isShortsPage = useMemo(() => {
    return pathname === '/shorts' || pathname?.startsWith('/shorts/');
  }, [pathname]);
  
  // 독립적인 레이아웃이 필요한 페이지 여부
  const isIndependentLayout = useMemo(() => {
    return isAuthPage || isShortsPage;
  }, [isAuthPage, isShortsPage]);
  
  // queryClient를 useMemo로 최적화하여 불필요한 재생성 방지
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 30,   // 30분 (이전 버전의 cacheTime)
        retry: 1, // 실패시 1번 재시도
        refetchOnWindowFocus: false, // 윈도우 포커스시 재요청 비활성화
        refetchOnMount: false, // 컴포넌트 마운트 시 재요청 비활성화
        refetchOnReconnect: false, // 네트워크 재연결 시 재요청 비활성화
      },
    },
  }), []);
  
  // 페이지 전환 감지 및 스크롤 복원 관리
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // 사이드바가 열려있다면 닫기 (모바일)
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // 스크롤 위치 복원 (필요 시)
      window.scrollTo(0, 0);
      
      // 경로 변경 저장
      prevPathnameRef.current = pathname;
    }
  }, [pathname, isSidebarOpen]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {isIndependentLayout ? (
            // 인증 페이지나 쇼츠 페이지일 경우 헤더, 사이드바 없이 직접 children만 렌더링
            children
          ) : (
            // 일반 페이지는 기존 레이아웃 사용
            <div className="flex flex-col min-h-screen w-full">
              <Header 
                onMenuClick={() => setIsSidebarOpen(true)} 
                isSidebarOpen={isSidebarOpen} 
              />
              <div className="flex flex-1 w-full md:max-w-screen-2xl md:mx-auto">
                {/* 데스크탑에서는 레이아웃 내에 사이드바 표시 */}
                <SidebarWrapper 
                  isOpen={isSidebarOpen} 
                  onClose={() => setIsSidebarOpen(false)}
                  boardNavigation={boardNavigation}
                />
                <main className="flex-1 md:p-4 w-full overflow-y-auto box-border">
                  {children}
                </main>
                <RightSidebar />
              </div>
              <Footer />
            </div>
          )}
          
          {/* 인증 페이지나 쇼츠 페이지에서는 토스트 컨테이너가 표시되지 않도록 */}
          {!isIndependentLayout && (
            <ToastContainer 
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          )}
        </ThemeProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 
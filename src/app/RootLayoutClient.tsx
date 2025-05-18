'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/domains/layout';
import Footer from '@/shared/components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IconProvider } from '@/shared/context/IconContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Sidebar from '@/domains/sidebar/components/Sidebar';
import { HeaderUserData } from '@/domains/layout/types/header';

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
  rightSidebar: React.ReactNode;
  authSection: React.ReactNode;
  leagueStandingsComponent: React.ReactNode;
  headerUserData?: HeaderUserData | null;
  initialIconUrl?: string;
  initialIconName?: string;
}

export default function RootLayoutClient({ 
  children, 
  boardNavigation, 
  rightSidebar,
  authSection,
  leagueStandingsComponent,
  headerUserData,
  initialIconUrl = '',
  initialIconName = ''
}: RootLayoutClientProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      if (isOpen) {
        setIsOpen(false);
      }
      
      // 스크롤 위치 복원 (필요 시)
      window.scrollTo(0, 0);
      
      // 경로 변경 저장
      prevPathnameRef.current = pathname;
    }
  }, [pathname, isOpen]);

  // 사이드바 열기 토글
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // 사이드바 닫기
  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IconProvider initialIconUrl={initialIconUrl} initialIconName={initialIconName}>
          {isIndependentLayout ? (
            // 인증 페이지나 쇼츠 페이지일 경우 헤더, 사이드바 없이 직접 children만 렌더링
            children
          ) : (
            // 일반 페이지는 기존 레이아웃 사용
            <AuthStateManager 
              headerUserData={headerUserData}
              authSection={authSection}
              boardNavigation={boardNavigation}
              leagueStandingsComponent={leagueStandingsComponent}
              rightSidebar={rightSidebar}
              isOpen={isOpen}
              onClose={closeSidebar}
              onMenuClick={toggleSidebar}
            >
              {children}
            </AuthStateManager>
          )}
            
          {/* 항상 ToastContainer를 표시하도록 수정 */}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            limit={3}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </IconProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// 인증 상태 변경을 감지하는 래퍼 컴포넌트
function AuthStateManager({
  children,
  headerUserData,
  authSection,
  boardNavigation,
  leagueStandingsComponent,
  rightSidebar,
  isOpen,
  onClose,
  onMenuClick
}: {
  children: React.ReactNode,
  headerUserData?: HeaderUserData | null,
  authSection: React.ReactNode,
  boardNavigation: React.ReactNode,
  leagueStandingsComponent: React.ReactNode,
  rightSidebar: React.ReactNode,
  isOpen: boolean,
  onClose: () => void,
  onMenuClick: () => void
}) {
  const { user } = useAuth();
  const router = useRouter();
  
  // 인증 상태 변경 감지 및 리다이렉트 처리
  useEffect(() => {
    // 인증 상태 변경시 레이아웃 갱신
    router.refresh();
  }, [user, router]);
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header
        onMenuClick={onMenuClick}
        isSidebarOpen={isOpen}
        userData={headerUserData}
      />
      <div className="flex flex-1 w-full md:max-w-screen-2xl md:mx-auto">
        {/* 도메인 구조로 변경된 Sidebar 컴포넌트 사용 */}
        <Sidebar 
          isOpen={isOpen}
          onClose={onClose}
          leagueStandingsComponent={leagueStandingsComponent}
          authSection={authSection}
        >
          {boardNavigation}
        </Sidebar>
        <main className="flex-1 md:p-4 w-full overflow-y-auto box-border">
          {children}
        </main>
        {rightSidebar}
      </div>
      <Footer />
    </div>
  );
} 
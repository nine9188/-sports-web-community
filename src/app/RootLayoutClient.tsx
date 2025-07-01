'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, startTransition, useDeferredValue } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/shared/context/AuthContext';
import { IconProvider } from '@/shared/context/IconContext';
import AuthStateManager from '@/shared/components/AuthStateManager';
import { HeaderUserData } from '@/domains/layout/types/header';
import { Board } from '@/domains/layout/types/board';

import { Session } from '@supabase/supabase-js';

interface RootLayoutClientProps {
  children: React.ReactNode;
  boardNavigation: React.ReactNode;
  rightSidebar: React.ReactNode;
  authSection: React.ReactNode;
  leagueStandingsComponent: React.ReactNode;
  headerUserData?: HeaderUserData | null;
  headerBoards?: Board[];
  headerIsAdmin?: boolean;
  initialIconUrl?: string;
  initialIconName?: string;
  initialSession?: Session | null;
}

export default function RootLayoutClient({ 
  children, 
  boardNavigation, 
  rightSidebar,
  authSection,
  leagueStandingsComponent,
  headerUserData,
  headerBoards,
  headerIsAdmin,
  initialIconUrl = '',
  initialIconName = '',
  initialSession = null
}: RootLayoutClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>('');
  
  // React 18 동시성 기능: 사이드바 상태를 지연시켜 메인 스레드 블로킹 방지
  const deferredIsOpen = useDeferredValue(isOpen);
  const deferredIsProfileOpen = useDeferredValue(isProfileOpen);
  
  // 독립적인 레이아웃이 필요한 경로들 확인
  const isIndependentLayout = useMemo(() => {
    if (!pathname) return false;
    
    // 인증 관련 경로들 (라우트 그룹 (auth) 사용)
    const authPaths = ['/signin', '/signup', '/social-signup'];
    
    return pathname.startsWith('/auth/') || 
           pathname.startsWith('/admin') ||  // /admin과 /admin/로 시작하는 모든 경로
           pathname.startsWith('/help/') ||
           authPaths.includes(pathname);
  }, [pathname]);

  // queryClient를 useMemo로 최적화하여 불필요한 재생성 방지
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 10, // 10분 (cacheTime 대신 gcTime 사용)
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        notifyOnChangeProps: ['data', 'error', 'isLoading'], // 성능 최적화
        refetchInterval: false, // 자동 리페치 비활성화
        // 성능 최적화 추가
        structuralSharing: false, // 구조적 공유 비활성화로 성능 향상
        networkMode: 'online', // 온라인일 때만 요청
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  }), []);
  
  // 사이드바 닫기 함수 - useCallback으로 최적화 + startTransition 적용
  const closeSidebar = useCallback(() => {
    startTransition(() => {
      setIsOpen(false);
    });
  }, []);

  // 프로필 사이드바 토글 함수
  const toggleProfileSidebar = useCallback(() => {
    startTransition(() => {
      setIsProfileOpen(prev => !prev);
    });
  }, []);

  // 프로필 사이드바 닫기 함수
  const closeProfileSidebar = useCallback(() => {
    startTransition(() => {
      setIsProfileOpen(false);
    });
  }, []);
  
  // 페이지 전환 감지 및 스크롤 복원 관리 - 디바운스 적용 + startTransition
  useEffect(() => {
    if (pathname && prevPathnameRef.current !== pathname) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          // 사이드바가 열려있다면 닫기 (모바일)
          if (isOpen) {
            setIsOpen(false);
          }
          
          // 프로필 사이드바가 열려있다면 닫기 (모바일)
          if (isProfileOpen) {
            setIsProfileOpen(false);
          }
          
          // 스크롤 위치 복원
          window.scrollTo(0, 0);
          
          // 경로 변경 저장
          prevPathnameRef.current = pathname;
        });
      }, 50); // 50ms 디바운스
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, isOpen, isProfileOpen]);

  // ToastContainer 설정을 메모이제이션
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
      <AuthProvider initialSession={initialSession}>
        <IconProvider initialIconUrl={initialIconUrl} initialIconName={initialIconName}>
          {isIndependentLayout ? (
            children
          ) : (
            <AuthStateManager 
              authSection={authSection}
              boardNavigation={boardNavigation}
              leagueStandingsComponent={leagueStandingsComponent}
              rightSidebar={rightSidebar}
              headerUserData={headerUserData}
              headerBoards={headerBoards}
              headerIsAdmin={headerIsAdmin}
              isOpen={deferredIsOpen}
              onClose={closeSidebar}
              isProfileOpen={deferredIsProfileOpen}
              onProfileClose={closeProfileSidebar}
              onProfileClick={toggleProfileSidebar}
            >
              {children}
            </AuthStateManager>
          )}
            
          <ToastContainer {...toastConfig} />
        </IconProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 
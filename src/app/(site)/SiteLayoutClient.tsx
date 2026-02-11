'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, startTransition, useDeferredValue } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AuthStateManager from '@/shared/components/AuthStateManager';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import { getFullUserData } from '@/shared/actions/user';
import { Board } from '@/domains/layout/types/board';
import { HeaderUserData } from '@/shared/types/user';
import { scrollToTop } from '@/shared/utils/scroll';

interface SiteLayoutClientProps {
  children?: React.ReactNode;
  boardNavigation: React.ReactNode;
  rightSidebar: React.ReactNode;
  headerBoards?: Board[];
  headerTotalPostCount?: number;
}

export default function SiteLayoutClient({
  children,
  boardNavigation,
  rightSidebar,
  headerBoards,
  headerTotalPostCount,
}: SiteLayoutClientProps) {
  // 유저 데이터를 클라이언트에서 fetch (layout 블로킹 제거)
  const { data: fullUserData } = useQuery({
    queryKey: ['fullUserData'],
    queryFn: () => getFullUserData(),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = fullUserData?.is_admin ?? false;

  // HeaderUserData 형태로 변환 (AuthStateManager에 전달)
  const headerUserData: HeaderUserData | null = fullUserData ? {
    id: fullUserData.id,
    nickname: fullUserData.nickname,
    email: fullUserData.email,
    level: fullUserData.level,
    exp: fullUserData.exp,
    points: fullUserData.points,
    iconInfo: fullUserData.icon_url ? {
      iconUrl: fullUserData.icon_url,
      iconName: fullUserData.icon_name || undefined
    } : null,
    isAdmin: fullUserData.is_admin
  } : null;

  // AuthSection을 클라이언트에서 렌더링 (유저 데이터 로드 후 업데이트)
  const authSection = <AuthSection userData={fullUserData ?? null} />;

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>('');

  // React 18 동시성 기능: 사이드바 상태를 지연시켜 메인 스레드 블로킹 방지
  const deferredIsOpen = useDeferredValue(isOpen);
  const deferredIsProfileOpen = useDeferredValue(isProfileOpen);

  // 독립적인 레이아웃이 필요한 경로들 확인 (admin, help 등)
  const isIndependentLayout = useMemo(() => {
    if (!pathname) return false;

    // 독립 레이아웃이 필요한 단일 경로들
    const standaloneRoots = ['/terms', '/privacy'];

    return pathname.startsWith('/admin') ||  // /admin과 /admin/로 시작하는 모든 경로
           pathname.startsWith('/help/') ||
           standaloneRoots.some(root => pathname === root || pathname.startsWith(`${root}/`));
  }, [pathname]);

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

  // 페이지 전환 감지 및 스크롤 복원 관리
  useEffect(() => {
    if (pathname && prevPathnameRef.current !== pathname) {
      // Next.js의 자동 스크롤 복원을 막기
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      // 페이지 이동 시 즉시 스크롤
      scrollToTop('auto');

      // 사이드바 닫기는 낮은 우선순위로 처리
      startTransition(() => {
        if (isOpen) {
          setIsOpen(false);
        }

        if (isProfileOpen) {
          setIsProfileOpen(false);
        }
      });

      // 경로 변경 저장
      prevPathnameRef.current = pathname;
    }
  }, [pathname, isOpen, isProfileOpen]);

  return isIndependentLayout ? (
    children
  ) : (
    <AuthStateManager
      authSection={authSection}
      boardNavigation={boardNavigation}
      rightSidebar={rightSidebar}
      headerUserData={headerUserData}
      headerBoards={headerBoards}
      headerIsAdmin={isAdmin}
      headerTotalPostCount={headerTotalPostCount}
      fullUserData={fullUserData ?? null}
      isOpen={deferredIsOpen}
      onClose={closeSidebar}
      isProfileOpen={deferredIsProfileOpen}
      onProfileClose={closeProfileSidebar}
      onProfileClick={toggleProfileSidebar}
    >
      {children}
    </AuthStateManager>
  );
}

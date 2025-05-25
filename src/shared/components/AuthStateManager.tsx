'use client';

import React, { useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import { Header } from '@/domains/layout';
import Footer from '@/shared/components/Footer';
import Sidebar from '@/domains/sidebar/components/Sidebar';
import { HeaderUserData } from '@/domains/layout/types/header';
import { Board } from '@/domains/layout/types/board';

// AuthStateManager를 React.memo로 최적화
const AuthStateManager = React.memo(function AuthStateManager({
  children,
  headerUserData,
  authSection,
  boardNavigation,
  leagueStandingsComponent,
  rightSidebar,
  isOpen,
  onClose,
  onMenuClick,
  boardsData
}: {
  children: React.ReactNode,
  headerUserData?: HeaderUserData | null,
  authSection: React.ReactNode,
  boardNavigation: React.ReactNode,
  leagueStandingsComponent: React.ReactNode,
  rightSidebar: React.ReactNode,
  isOpen: boolean,
  onClose: () => void,
  onMenuClick: () => void,
  boardsData: Board[]
}) {
  const { user } = useAuth();
  const router = useRouter();
  
  // 인증 상태 변경 감지 및 리다이렉트 처리 - 디바운스 적용 + startTransition
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 100); // 100ms 디바운스
    
    return () => clearTimeout(timeoutId);
  }, [user, router]);
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header
        onMenuClick={onMenuClick}
        isSidebarOpen={isOpen}
        userData={headerUserData}
        boards={boardsData}
      />
      <div className="flex flex-1 w-full md:max-w-screen-2xl md:mx-auto">
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
});

export default AuthStateManager; 
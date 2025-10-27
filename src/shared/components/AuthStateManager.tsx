'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import Header from '@/domains/layout/components/Header';
import Footer from '@/shared/components/Footer';
import Sidebar from '@/domains/sidebar/components/Sidebar';
import ProfileSidebar from '@/domains/sidebar/components/ProfileSidebar';
import { UniversalChatbot } from '@/domains/chatbot/components/UniversalChatbot';
import { HeaderUserData } from '@/domains/layout/types/header';
import { Board } from '@/domains/layout/types/board';
import { MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';

// AuthStateManager를 React.memo로 최적화
const AuthStateManager = React.memo(function AuthStateManager({
  children,
  authSection,
  boardNavigation,
  leagueStandingsComponent,
  rightSidebar,
  headerUserData,
  headerBoards,
  headerIsAdmin,
  liveScoreData,
  isOpen,
  onClose,
  isProfileOpen,
  onProfileClose,
  onProfileClick
}: {
  children: React.ReactNode,
  authSection: React.ReactNode,
  boardNavigation: React.ReactNode,
  leagueStandingsComponent: React.ReactNode,
  rightSidebar: React.ReactNode,
  headerUserData?: HeaderUserData | null,
  headerBoards?: Board[],
  headerIsAdmin?: boolean,
  liveScoreData?: MultiDayMatchesResult,
  isOpen: boolean,
  onClose: () => void,
  isProfileOpen: boolean,
  onProfileClose: () => void,
  onProfileClick: () => void
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // 매치 페이지인지 확인
  const isMatchPage = pathname?.includes('/livescore/football/match/');
  
  // 인증 상태 변경 감지 및 리다이렉트 처리 - 불필요한 refresh 제거
  useEffect(() => {
    // router.refresh() 호출을 제거하여 무한 루프 방지
    // 인증 상태 변경은 AuthContext에서 이미 처리되고 있음
  }, [user]);
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header
        onProfileClick={onProfileClick}
        initialUserData={headerUserData}
        boards={headerBoards}
        isAdmin={headerIsAdmin}
        liveScoreData={liveScoreData}
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
        <ProfileSidebar
          isOpen={isProfileOpen}
          onClose={onProfileClose}
        />
        <main className="flex-1 mt-2 mb-2 md:px-4 w-full box-border" style={{ overflow: isMatchPage ? 'visible' : 'auto' }}>
          {children}
        </main>
        {/* 매치 페이지일 때는 사이드바 없음, 아니면 기본 사이드바 */}
        {!isMatchPage && rightSidebar}
      </div>
      <Footer />
      
      {/* 챗봇 - 모든 사용자에게 표시 (로그인/비로그인 자동 감지) */}
      <UniversalChatbot />
    </div>
  );
});

export default AuthStateManager; 
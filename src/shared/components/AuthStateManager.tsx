'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import HeaderClient from '@/domains/layout/components/HeaderClient';
import Footer from '@/shared/components/Footer';
import Sidebar from '@/domains/sidebar/components/Sidebar';
import ProfileSidebar from '@/domains/sidebar/components/ProfileSidebar';
import { HeaderUserData, FullUserDataWithSession } from '@/shared/types/user';
import { Board } from '@/domains/layout/types/board';
const UniversalChatbot = dynamic(
  () => import('@/domains/chatbot/components/UniversalChatbot').then(mod => ({ default: mod.UniversalChatbot })),
  { ssr: false }
);

// AuthStateManager를 React.memo로 최적화
const AuthStateManager = React.memo(function AuthStateManager({
  children,
  authSection,
  boardNavigation,
  rightSidebar,
  headerUserData,
  headerBoards,
  headerIsAdmin,
  headerTotalPostCountSlot,
  fullUserData,
  isOpen,
  onClose,
  isProfileOpen,
  onProfileClose,
  onProfileClick,
  isMobilePhone,
}: {
  children: React.ReactNode,
  authSection: React.ReactNode,
  boardNavigation: React.ReactNode,
  rightSidebar: React.ReactNode,
  headerUserData?: HeaderUserData | null,
  headerBoards?: Board[],
  headerIsAdmin?: boolean,
  headerTotalPostCountSlot?: React.ReactNode,
  fullUserData?: FullUserDataWithSession | null,
  isOpen: boolean,
  onClose: () => void,
  isProfileOpen: boolean,
  onProfileClose: () => void,
  onProfileClick: () => void,
  isMobilePhone?: boolean, // legacy — kept for interface compat
}) {
  const pathname = usePathname();

  // 매치 페이지인지 확인 (사이드바 숨김용)
  const isMatchPage = pathname?.includes('/livescore/football/match/');
  
  return (
    <div className="flex flex-col min-h-screen w-full" data-site-shell>
      <div data-site-header>
      <HeaderClient
        onProfileClick={onProfileClick}
        isSidebarOpen={false}
        initialUserData={headerUserData}
        boards={headerBoards || []}
        isAdmin={headerIsAdmin}
        totalPostCountSlot={headerTotalPostCountSlot}
      />
      </div>
      <div className="flex flex-1 w-full md:max-w-[1360px] md:mx-auto bg-transparent" data-site-content-row>
        <div data-site-left-sidebar>
        <Sidebar
          isOpen={isOpen}
          onClose={onClose}
          authSection={authSection}
        >
          {boardNavigation}
        </Sidebar>
        </div>
        <ProfileSidebar
          isOpen={isProfileOpen}
          onClose={onProfileClose}
          userData={fullUserData}
        />
        <main className="flex-1 mt-4 mb-4 md:px-4 w-full min-w-0 box-border bg-transparent" data-site-main>
          {children}
        </main>
        {/* 매치 페이지일 때는 사이드바 없음, 아니면 기본 사이드바 */}
        {!isMatchPage && <div data-site-right-sidebar>{rightSidebar}</div>}
      </div>
      <div data-site-footer>
        <Footer />
      </div>

      {/* 챗봇 - 모든 사용자에게 표시 (로그인/비로그인 자동 감지) */}
      <div data-site-chatbot>
        <UniversalChatbot />
      </div>
    </div>
  );
});

export default AuthStateManager; 

'use client';

import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { Suspense } from 'react';
import { SidebarProps } from '../types';

// 로딩 중 표시할 스켈레톤 UI
function LeagueStandingsSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden hidden md:block animate-pulse">
      <div className="bg-[#262626] text-white py-2 px-3 text-sm font-medium">
        축구 팀순위
      </div>
      <div className="flex border-b">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 h-7 bg-[#EAEAEA] dark:bg-[#333333]"></div>
        ))}
      </div>
      <div className="p-3 space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-5 w-full bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  children,
  leagueStandingsComponent,
  authSection,
}: SidebarProps) {
  return (
    <>
      {/* Overlay - 모바일에서만 표시 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] lg:hidden pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* 데스크탑 사이드바 (왼쪽에 고정) */}
      <div
        className="fixed lg:relative top-0 lg:top-0 left-0 h-[100dvh] lg:h-auto w-[300px]
          transform transition-transform duration-300 ease-in-out z-[1000] lg:z-30
          -translate-x-full lg:translate-x-0 hidden lg:block"
      >
        {/* 스크롤 영역 */}
        <div className="h-[calc(100dvh-56px)] lg:h-full overflow-y-auto pt-4">
          {/* 사용자 정보 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <ContainerTitle>계정</ContainerTitle>
            </ContainerHeader>
            <ContainerContent>
              {authSection}
            </ContainerContent>
          </Container>

          {/* 게시판 이동 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <ContainerTitle>게시판 이동</ContainerTitle>
            </ContainerHeader>
            <ContainerContent className="px-0 py-0">
              {children}
            </ContainerContent>
          </Container>

          {/* 축구 리그 순위 위젯 - 서버 컴포넌트 사용 */}
          <div className="mb-4">
            <Suspense fallback={<LeagueStandingsSkeleton />}>
              {leagueStandingsComponent}
            </Suspense>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 (오른쪽에서 열림) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md
          bg-white transform transition-transform duration-300 ease-in-out z-[1000]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}
      >
        {/* 모바일 닫기 버튼 */}
        <div className="flex items-center justify-between h-14 border-b border-black/7 dark:border-white/10 px-4">
          <span className="font-medium text-gray-900">커뮤니티</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 스크롤 영역 */}
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
          {/* 모바일에서는 사용자 정보 섹션 제거 */}

          {/* 게시판 이동 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <ContainerTitle>카테고리</ContainerTitle>
            </ContainerHeader>
            <ContainerContent>
              {children}
            </ContainerContent>
          </Container>

          {/* 축구 리그 순위 위젯 - 서버 컴포넌트 사용 */}
          <div className="mb-4">
            <Suspense fallback={<LeagueStandingsSkeleton />}>
              {leagueStandingsComponent}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

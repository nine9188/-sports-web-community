'use client';

import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Suspense } from 'react';
import { ReactNode } from 'react';

// 로딩 중 표시할 스켈레톤 UI
function LeagueStandingsSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden hidden md:block animate-pulse">
      <div className="bg-slate-800 text-white py-2 px-3 text-sm font-medium">
        축구 팀순위
      </div>
      <div className="flex border-b">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 h-7 bg-gray-200"></div>
        ))}
      </div>
      <div className="p-3 space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-5 w-full bg-gray-200 rounded"></div>
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
}: {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  leagueStandingsComponent?: ReactNode;
  authSection?: ReactNode;
}) {
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
        className="fixed lg:relative top-0 lg:top-0 left-0 h-[100dvh] lg:h-auto w-[280px] 
          bg-white transform transition-transform duration-300 ease-in-out z-[1000] lg:z-30
          -translate-x-full lg:translate-x-0 hidden lg:block"
      >
        {/* 스크롤 영역 */}
        <div className="h-[calc(100dvh-56px)] lg:h-full overflow-y-auto bg-white pt-4">
          {/* 사용자 정보 섹션 - 오른쪽 사이드바와 같은 스타일의 테두리 적용 */}
          <div className="mb-4 bg-white rounded-lg border">
            <div className="px-3 py-2 border-b">
              <h3 className="text-sm font-bold">계정</h3>
            </div>
            <div className="px-3 py-2">
              {authSection}
            </div>
          </div>
          
          {/* 게시판 이동 섹션 - 오른쪽 사이드바와 같은 스타일의 테두리 적용 */}
          <div className="mb-4 bg-white rounded-lg border">
            <div className="px-3 py-2 border-b">
              <h3 className="text-sm font-bold">게시판 이동</h3>
            </div>
            <div className="px-3 py-2">
              {/* 기존 BoardNavigation 대신 children prop을 통해 서버 컴포넌트 전달 */}
              {children}
            </div>
          </div>

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
        <div className="flex items-center justify-between h-14 border-b px-4">
          <span className="font-medium">커뮤니티</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 스크롤 영역 */}
        <div className="h-[calc(100%-56px)] overflow-y-auto bg-white">
          {/* 사용자 정보 섹션 - 모바일용 */}
          <div className="mb-4 bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-bold">계정</h3>
            </div>
            <div className="px-4 py-2">
              {authSection}
            </div>
          </div>
          
          {/* 게시판 이동 섹션 */}
          <div className="mb-4 bg-white">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-bold">카테고리</h3>
            </div>
            <div className="px-4 py-2">
              {/* 기존 BoardNavigation 대신 children prop을 통해 서버 컴포넌트 전달 */}
              {children}
            </div>
          </div>

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
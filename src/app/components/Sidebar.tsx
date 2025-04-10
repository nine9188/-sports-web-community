'use client';

import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import AuthSection from './sidebar/auth-section';
// import LeagueStandings from './sidebar/LeagueStandings';
import ServerLeagueStandings from './sidebar/ServerLeagueStandings';
import { ReactNode } from 'react';

export default function Sidebar({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] lg:hidden pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed lg:relative top-0 lg:top-0 left-0 h-[100dvh] lg:h-auto w-[280px] 
          bg-white transform transition-transform duration-300 ease-in-out z-[1000] lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center h-14 border-b lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onClose}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">메뉴</span>
        </div>

        {/* 스크롤 영역 */}
        <div className="h-[calc(100dvh-56px)] lg:h-full overflow-y-auto bg-white pt-4">
          {/* 사용자 정보 섹션 - 오른쪽 사이드바와 같은 스타일의 테두리 적용 */}
          <div className="mb-4 bg-white rounded-lg border">
            <div className="px-3 py-2 border-b">
              <h3 className="text-sm font-bold">계정</h3>
            </div>
            <div className="px-3 py-2">
              <AuthSection />
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

          {/* 축구 리그 순위 위젯 */}
          <div className="mb-4">
            {/* <LeagueStandings /> */}
            <ServerLeagueStandings />
          </div>
        </div>
      </div>
    </>
  );
}
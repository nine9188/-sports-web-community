'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Board } from '../types/board';
import {
  SearchBar,
  TopLevelBoard,
  DropdownMenu,
  MegaDropdownMenu,
  MobileBoardModal
} from './navigation';

// Props 타입 정의
interface BoardNavigationClientProps {
  boards: Board[];
  isAdmin?: boolean;
}

// 메인 컴포넌트 - 실제 데이터 사용
function BoardNavigationClient({ boards, isAdmin = false }: BoardNavigationClientProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 메가 드롭다운 사용 여부 결정 (하위 메뉴가 있으면 메가 드롭다운 사용)
  const shouldUseMegaDropdown = (board: Board) => {
    if (!board.children) return false;
    
    // 하위 메뉴가 있으면 메가 드롭다운 사용
    return board.children.length > 0;
  };

  // 타이머 정리 함수
  const clearTimers = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  // 호버 시작 처리
  const handleMouseEnter = (boardId: string, element: HTMLDivElement) => {
    clearTimers();
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // 메가 드롭다운의 경우 헤더 바로 아래에 전체 너비로 표시
    const currentBoard = boards.find(b => b.id === boardId);
    const useMega = currentBoard ? shouldUseMegaDropdown(currentBoard) : false;
    
    if (useMega) {
      // 메가 드롭다운: 헤더 바로 아래 전체 너비
      // 헤더의 높이를 기준으로 계산 (일반적으로 헤더 컨테이너의 bottom)
      const headerElement = element.closest('header') || element.closest('[role="banner"]') || element.closest('nav');
      const headerBottom = headerElement ? headerElement.getBoundingClientRect().bottom : rect.bottom;
      
      setDropdownPosition({
        top: headerBottom,
        left: 0 // 메가 드롭다운에서는 left 값이 중요하지 않음 (전체 너비 사용)
      });
    } else {
      // 일반 드롭다운: 기존 로직
      const menuWidth = 240;
      const spacing = 10;
      
      let left = rect.left;
      
      if (left + menuWidth > viewportWidth - spacing) {
        left = viewportWidth - menuWidth - spacing;
      }
      
      if (left < spacing) {
        left = spacing;
      }
      
      setDropdownPosition({
        top: rect.bottom,
        left: left
      });
    }
    
    setHoveredBoard(boardId);
  };

  // 호버 종료 처리 (트리거 요소에서)
  const handleMouseLeave = () => {
    clearTimers();
    
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      setDropdownPosition(null);
    }, 150);
  };

  // 드롭다운 메뉴에 마우스 진입
  const handleDropdownMouseEnter = () => {
    clearTimers();
  };

  // 드롭다운 메뉴에서 마우스 이탈
  const handleDropdownMouseLeave = () => {
    clearTimers();
    
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      setDropdownPosition(null);
    }, 150);
  };

  // 게시판 클릭 처리
  const handleBoardClick = (board: Board) => {
    // 모든 게시판이 클릭 가능하도록 변경 (하위 메뉴 여부와 관계없이)
    router.push(`/boards/${board.slug || board.id}`);
  };

  // 드롭다운 닫기
  const closeDropdown = () => {
    clearTimers();
    setHoveredBoard(null);
    setDropdownPosition(null);
  };

  // 현재 호버된 게시판 찾기
  const hoveredBoardData = hoveredBoard ? boards.find(b => b.id === hoveredBoard) : null;

  return (
    <>
      {/* 데스크탑 네비게이션 */}
      <div className="hidden md:flex items-center justify-between gap-4 w-full">
        {/* 게시판 네비게이션 - 스크롤 가능한 영역 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory min-w-0 flex-1">
          {/* 게시판 목록 */}
          {boards.map(board => (
            <TopLevelBoard
              key={board.id}
              board={board}
              onHover={handleMouseEnter}
              onLeave={handleMouseLeave}
              onClick={handleBoardClick}
            />
          ))}
          
          {/* 라이브스코어 링크 */}
          <Link
            href="/livescore/football"
            className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            라이브스코어
          </Link>

          {/* 이적시장 링크 */}
          <Link
            href="/transfers"
            className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M16 3h5v5M16 8l5-5m-1 10v5h-5m-8-5l-5 5v-5h5m8-8v5h5m-5-5l5 5"/>
            </svg>
            이적시장
          </Link>

          {/* 데이터센터 링크 */}
          <Link
            href="/livescore/football/leagues"
            className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
              <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
            </svg>
            데이터센터
          </Link>

          {/* 아이콘샵 링크 */}
          <Link
            href="/shop"
            className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            아이콘샵
          </Link>

          {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              관리자
            </Link>
          )}
        </div>

        {/* 검색창 - 제일 오른쪽에 고정 */}
        <div className="flex-shrink-0">
          <SearchBar />
        </div>

        {/* 드롭다운 메뉴 - 조건에 따라 메가 드롭다운 또는 일반 드롭다운 */}
        {hoveredBoardData && dropdownPosition && (
          shouldUseMegaDropdown(hoveredBoardData) ? (
            <MegaDropdownMenu
              board={hoveredBoardData}
              position={dropdownPosition}
              onClose={closeDropdown}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            />
          ) : (
            <DropdownMenu
              board={hoveredBoardData}
              position={dropdownPosition}
              onClose={closeDropdown}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            />
          )
        )}
      </div>

      {/* 모바일 네비게이션 */}
      <div className="md:hidden flex items-center justify-between gap-2 w-full">
        {/* 네비게이션 링크들 */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
          >
            게시판
            <ChevronDown className="h-3 w-3" />
          </button>

          <Link
            href="/livescore/football"
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            라이브
          </Link>

          <Link
            href="/transfers"
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M16 3h5v5M16 8l5-5m-1 10v5h-5m-8-5l-5 5v-5h5m8-8v5h5m-5-5l5 5"/>
            </svg>
            이적
          </Link>

          <Link
            href="/livescore/football/leagues"
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
              <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
            </svg>
            데이터
          </Link>

          <Link
            href="/shop"
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            샵
          </Link>

          {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              관리자
            </Link>
          )}
        </div>

        {/* 모바일 검색창 제거 - HeaderClient로 이동 */}
      </div>

      {/* 모바일 게시판 모달 */}
      <MobileBoardModal
        boards={boards}
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}

export default BoardNavigationClient;
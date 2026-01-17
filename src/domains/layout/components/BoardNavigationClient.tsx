'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Board } from '../types/board';
import {
  SearchBar,
  TopLevelBoard,
  SimpleDropdownMenu,
  MobileBoardModal
} from './navigation';

// 가상 네비게이션 Board 데이터
const createNavBoards = (boards: Board[]): Board[] => {
  // 실제 보드에서 필요한 것들 찾기 - 스포츠
  const soccerBoard = boards.find(b => b.slug === 'soccer');
  const kleagueBoard = boards.find(b => b.slug === 'k-league');
  const newsBoard = boards.find(b => b.slug === 'news');
  const dataAnalysisBoard = boards.find(b => b.slug === 'data-analysis');

  // 실제 보드에서 필요한 것들 찾기 - 커뮤니티
  const freeBoard = boards.find(b => b.slug === 'free');
  const hotdealBoard = boards.find(b => b.slug === 'hotdeal');
  const marketBoard = boards.find(b => b.slug === 'market');
  const reviewBoard = boards.find(b => b.slug === 'review');
  const creativeBoard = boards.find(b => b.slug === 'creative');

  return [
    {
      id: 'nav-posts',
      name: '전체/인기',
      slug: 'all',
      parent_id: null,
      display_order: -2,
      children: [
        { id: 'nav-all', name: '전체글', slug: 'all', parent_id: 'nav-posts', display_order: 0, children: [] },
        { id: 'nav-popular', name: '인기글', slug: 'popular', parent_id: 'nav-posts', display_order: 1, children: [] }
      ]
    },
    {
      id: 'nav-sports',
      name: '스포츠',
      slug: 'soccer',
      parent_id: null,
      display_order: -1,
      children: [
        ...(soccerBoard ? [{ ...soccerBoard, name: '해외축구', parent_id: 'nav-sports', display_order: 0 }] : []),
        ...(kleagueBoard ? [{ ...kleagueBoard, name: '국내축구', parent_id: 'nav-sports', display_order: 1 }] : []),
        ...(newsBoard ? [{ ...newsBoard, name: '축구소식', parent_id: 'nav-sports', display_order: 2 }] : []),
        ...(dataAnalysisBoard ? [{ ...dataAnalysisBoard, name: '데이터분석', parent_id: 'nav-sports', display_order: 3 }] : [])
      ]
    },
    {
      id: 'nav-community',
      name: '커뮤니티',
      slug: 'free',
      parent_id: null,
      display_order: 50,
      children: [
        ...(freeBoard ? [{ ...freeBoard, name: '자유게시판', parent_id: 'nav-community', display_order: 0 }] : []),
        ...(hotdealBoard ? [{ ...hotdealBoard, name: '핫딜', parent_id: 'nav-community', display_order: 1 }] : []),
        ...(marketBoard ? [{ ...marketBoard, name: '자유마켓', parent_id: 'nav-community', display_order: 2 }] : []),
        ...(reviewBoard ? [{ ...reviewBoard, name: '인증/후기', parent_id: 'nav-community', display_order: 3 }] : []),
        ...(creativeBoard ? [{ ...creativeBoard, name: '창작', parent_id: 'nav-community', display_order: 4 }] : [])
      ]
    },
    // 개별 링크들 (드롭다운 없음)
    { id: 'nav-livescore', name: '라이브스코어', slug: 'livescore/football', parent_id: null, display_order: 100, children: [] },
    { id: 'nav-transfers', name: '이적시장', slug: 'transfers', parent_id: null, display_order: 101, children: [] },
    { id: 'nav-datacenter', name: '데이터센터', slug: 'livescore/football/leagues', parent_id: null, display_order: 102, children: [] }
  ];
};

// 네비에서 제외할 보드 slug 목록 (가상 그룹으로 묶이거나 제외됨)
const EXCLUDED_BOARD_SLUGS = ['soccer', 'k-league', 'news', 'data-analysis', 'youtube', 'free', 'hotdeal', 'market', 'review', 'creative'];

// 가상 보드 중 /boards/ 경로를 사용하는 보드 ID 목록
const BOARD_PATH_NAV_IDS = ['nav-posts', 'nav-all', 'nav-popular', 'nav-sports', 'nav-community'];

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

  // 가상 보드 데이터 생성
  const navBoards = useMemo(() => createNavBoards(boards), [boards]);

  // 전체 보드 (가상 그룹 + 나머지 실제 게시판 + 개별 링크)
  const allBoards = useMemo(() => {
    const postsBoard = navBoards.find(b => b.id === 'nav-posts');
    const sportsBoard = navBoards.find(b => b.id === 'nav-sports');
    const communityBoard = navBoards.find(b => b.id === 'nav-community');
    const livescoreLink = navBoards.find(b => b.id === 'nav-livescore');
    const transfersLink = navBoards.find(b => b.id === 'nav-transfers');
    const datacenterLink = navBoards.find(b => b.id === 'nav-datacenter');

    // 제외할 보드 필터링
    const filteredBoards = boards.filter(b => !EXCLUDED_BOARD_SLUGS.includes(b.slug || ''));

    return [
      ...(postsBoard ? [postsBoard] : []),
      ...(sportsBoard ? [sportsBoard] : []),
      ...(communityBoard ? [communityBoard] : []),
      ...filteredBoards,
      ...(livescoreLink ? [livescoreLink] : []),
      ...(transfersLink ? [transfersLink] : []),
      ...(datacenterLink ? [datacenterLink] : [])
    ];
  }, [boards, navBoards]);

  // 드롭다운 표시 여부 결정 (하위 메뉴가 있어야 드롭다운 표시)
  const hasChildren = (board: Board) => {
    return board.children && board.children.length > 0;
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

    // 하위 게시판이 없으면 드롭다운 표시 안함
    const currentBoard = allBoards.find(b => b.id === boardId);
    if (!currentBoard || !hasChildren(currentBoard)) {
      return;
    }

    // 심플 드롭다운: 호버된 요소 바로 아래
    const rect = element.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom,
      left: rect.left + rect.width / 2
    });

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
    // 가상 보드인 경우 (nav- 프리픽스)
    if (board.id.startsWith('nav-')) {
      // 글 관련 가상 보드는 /boards/ 경로 사용
      if (BOARD_PATH_NAV_IDS.includes(board.id)) {
        router.push(`/boards/${board.slug}`);
      } else {
        // 축구 관련 가상 보드는 직접 경로 사용
        router.push(`/${board.slug}`);
      }
    } else {
      // 일반 게시판은 /boards/ 경로 사용
      router.push(`/boards/${board.slug || board.id}`);
    }
  };

  // 드롭다운 닫기
  const closeDropdown = () => {
    clearTimers();
    setHoveredBoard(null);
    setDropdownPosition(null);
  };

  // 현재 호버된 게시판 찾기
  const hoveredBoardData = hoveredBoard ? allBoards.find(b => b.id === hoveredBoard) : null;

  return (
    <>
      {/* 데스크탑 네비게이션 */}
      <div className="hidden md:flex items-center justify-between gap-4 w-full">
        {/* 게시판 네비게이션 - 스크롤 가능한 영역 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory min-w-0 flex-1">
          {/* 전체 보드 목록 (가상 + 실제 + 가상) */}
          {allBoards.map(board => (
            <TopLevelBoard
              key={board.id}
              board={board}
              onHover={handleMouseEnter}
              onLeave={handleMouseLeave}
              onClick={handleBoardClick}
            />
          ))}

          {/* 상점 링크 */}
          <Link
            href="/shop"
            className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded shrink-0 whitespace-nowrap snap-center transition-colors"
          >
            상점
          </Link>

          {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center transition-colors"
            >
              관리자
            </Link>
          )}
        </div>

        {/* 검색창 - 제일 오른쪽에 고정 */}
        <div className="flex-shrink-0">
          <SearchBar />
        </div>

        {/* 심플 드롭다운 메뉴 */}
        {hoveredBoardData && dropdownPosition && (
          <SimpleDropdownMenu
            board={hoveredBoardData}
            position={dropdownPosition}
            onClose={closeDropdown}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          />
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
            className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded shrink-0 transition-colors"
          >
            상점
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
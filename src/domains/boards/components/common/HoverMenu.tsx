'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChildBoard, TopBoard, HoverMenuProps, MobileBottomSheet } from './hover-menu';
import { Button, Container } from '@/shared/components/ui';

export default function HoverMenu({
  currentBoardId,
  topBoards,
  childBoardsMap,
  rootBoardId,
  rootBoardSlug,
  plain = false
}: HoverMenuProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 상위 게시판 정렬
  const sortedTopBoards = useMemo(() =>
    [...topBoards].sort((a, b) =>
      a.display_order !== b.display_order
        ? a.display_order - b.display_order
        : a.name.localeCompare(b.name)
    ), [topBoards]);

  // 보이는/숨겨진 게시판 계산
  const { visibleBoards, hiddenBoards } = useMemo(() => {
    const maxVisibleBoards = 3;

    if (isMobile && sortedTopBoards.length > maxVisibleBoards) {
      return {
        visibleBoards: sortedTopBoards.slice(0, maxVisibleBoards),
        hiddenBoards: sortedTopBoards.slice(maxVisibleBoards)
      };
    }

    return { visibleBoards: sortedTopBoards, hiddenBoards: [] as TopBoard[] };
  }, [sortedTopBoards, isMobile]);

  // 모바일 환경 체크
  useEffect(() => {
    let rafId: number | null = null;

    const checkMobile = () => {
      const mobile = window.innerWidth < 728;
      setIsMobile(mobile);
    };

    checkMobile();

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkMobile);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  // 메뉴 열기 — 100ms 딜레이 (실수 호버 방지)
  const handleMenuEnter = useCallback((boardId: string) => {
    // 닫기 타이머 취소
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // 이미 같은 메뉴면 무시
    if (hoveredBoard === boardId) return;

    // 다른 메뉴가 이미 열려있으면 즉시 전환 (딜레이 없이)
    if (hoveredBoard) {
      setHoveredBoard(boardId);
      return;
    }

    // 첫 열기는 100ms 딜레이
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(boardId);
      openTimeoutRef.current = null;
    }, 100);
  }, [hoveredBoard]);

  // 메뉴 닫기 — 200ms 유예 (드롭다운으로 이동할 시간)
  const handleMenuClose = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      closeTimeoutRef.current = null;
    }, 200);
  }, []);

  // 드롭다운 영역 진입 — 닫기 취소
  const handleDropdownEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // 모바일 드롭다운 토글
  const toggleMobileDropdown = useCallback(() => {
    setMobileDropdownOpen(!mobileDropdownOpen);
  }, [mobileDropdownOpen]);

  // 모바일 하위 메뉴 클릭
  const handleMobileSubmenuClick = useCallback((boardId: string) => (e: React.MouseEvent) => {
    if (isMobile && childBoardsMap[boardId]?.length > 0) {
      e.preventDefault();
      if (hoveredBoard === boardId) {
        setHoveredBoard(null);
        return;
      }
      setHoveredBoard(boardId);
    }
  }, [isMobile, childBoardsMap, hoveredBoard]);

  // 외부 클릭 시 닫기
  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setHoveredBoard(null);
      setMobileDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick, { passive: true });
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // 모바일 바텀시트 body 스크롤 잠금
  useEffect(() => {
    if (isMobile && hoveredBoard && childBoardsMap[hoveredBoard]?.length > 0) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isMobile, hoveredBoard, childBoardsMap]);

  // 드롭다운 위치 계산 — 호버된 탭 바로 아래에 정렬
  useEffect(() => {
    if (!hoveredBoard || !menuItemsRef.current[hoveredBoard] || !containerRef.current) return;

    const menuItem = menuItemsRef.current[hoveredBoard];
    const container = containerRef.current;

    if (menuItem && container) {
      const containerWidth = container.offsetWidth;
      const dropdownWidth = 280;

      // 호버된 탭의 왼쪽 기준으로 시작
      let left = menuItem.offsetLeft;

      // 오른쪽 넘침 방지
      if (left + dropdownWidth > containerWidth) {
        left = containerWidth - dropdownWidth;
      }
      if (left < 0) left = 0;

      // 탭의 하단 위치 계산 (2줄 wrapping 대응)
      const top = menuItem.offsetTop + menuItem.offsetHeight;

      setMenuPosition({ left, top });
    }
  }, [hoveredBoard, childBoardsMap]);

  // 2열 리스트 레이아웃
  const createListLayout = useCallback((childBoards: ChildBoard[]) => {
    const sortedChildBoards = [...childBoards].sort((a: ChildBoard, b: ChildBoard) =>
      a.display_order !== b.display_order
        ? a.display_order - b.display_order
        : a.name.localeCompare(b.name)
    );

    return (
      <div className="grid grid-cols-2">
        {sortedChildBoards.map((childBoard: ChildBoard, index: number) => {
          const isFirstRow = index < 2;
          const isLastRow = index >= sortedChildBoards.length - (sortedChildBoards.length % 2 || 2);

          return (
            <Link
              href={`/boards/${childBoard.slug || childBoard.id}`}
              prefetch={false}
              key={childBoard.id}
              className={`px-4 py-2.5 text-[13px] text-center transition-colors truncate ${
                isFirstRow ? 'first:rounded-tl-lg [&:nth-child(2)]:rounded-tr-lg' : ''
              } ${
                isLastRow ? 'last:rounded-br-lg' : ''
              } ${
                isLastRow && index % 2 === 0 ? 'rounded-bl-lg' : ''
              } ${
                childBoard.id === currentBoardId
                  ? 'text-gray-900 dark:text-[#F0F0F0] font-medium bg-[#EAEAEA] dark:bg-[#333333]'
                  : 'text-gray-900 dark:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D]'
              }`}
              onClick={() => setHoveredBoard(null)}
              title={childBoard.name}
            >
              {childBoard.name}
            </Link>
          );
        })}
      </div>
    );
  }, [currentBoardId]);

  const getChildBoards = useCallback((boardId: string) => {
    return childBoardsMap[boardId] || [];
  }, [childBoardsMap]);

  // 탭 아이템 렌더링
  const renderTabItem = useCallback((topBoard: TopBoard) => (
    <div
      key={topBoard.id}
      className="relative"
      ref={(el) => {
        menuItemsRef.current[topBoard.id] = el;
      }}
      onMouseEnter={() => !isMobile && handleMenuEnter(topBoard.id)}
      onMouseLeave={(e) => {
        if (isMobile) return;
        const relatedTarget = e.relatedTarget as Node;
        if (
          menuRef.current &&
          (menuRef.current.contains(relatedTarget) || menuRef.current === relatedTarget)
        ) {
          return;
        }
        handleMenuClose();
      }}
    >
      <Link
        href={`/boards/${topBoard.slug || topBoard.id}`}
        prefetch={false}
        className={`px-2 py-1 text-xs sm:text-[13px] whitespace-nowrap rounded-md flex items-center gap-1 transition-colors ${
          topBoard.id === currentBoardId || hoveredBoard === topBoard.id
            ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
            : 'text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
        }`}
        onClick={handleMobileSubmenuClick(topBoard.id)}
      >
        {topBoard.name}
        {childBoardsMap[topBoard.id]?.length > 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 transition-transform ${hoveredBoard === topBoard.id ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </Link>
    </div>
  ), [isMobile, handleMenuEnter, handleMenuClose, handleMobileSubmenuClick, childBoardsMap, currentBoardId, hoveredBoard]);

  const content = (
    <div className={`${plain ? 'px-0' : 'px-4 py-2.5'} relative overflow-visible`} ref={containerRef}>
      {/* 네비게이션 바 */}
      <nav className="flex items-center justify-between gap-2" ref={navRef}>
        {/* 전체 버튼 */}
        <Link
          href={`/boards/${rootBoardSlug || rootBoardId}`}
          prefetch={false}
          data-board="all"
          className={`px-2 py-1 text-xs sm:text-[13px] whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 flex-shrink-0 ${
            currentBoardId === rootBoardId ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          전체
        </Link>

        {/* 게시판 탭들 */}
        <div className="flex items-center justify-between gap-1 flex-1">
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            {visibleBoards.map(renderTabItem)}
          </div>

          {/* 더보기 버튼 (모바일) */}
          {hiddenBoards.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileDropdown}
              data-dropdown-toggle
              className="h-auto w-auto px-2 py-1 text-gray-700 dark:text-gray-300 flex-shrink-0"
              aria-label={mobileDropdownOpen ? '하위 게시판 접기' : '하위 게시판 펼치기'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  mobileDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
          )}
        </div>
      </nav>

      {/* 숨겨진 게시판 드롭다운 (모바일) */}
      {mobileDropdownOpen && hiddenBoards.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {hiddenBoards.map(renderTabItem)}
          </div>
        </div>
      )}

      {/* 하위 메뉴 */}
      {hoveredBoard && getChildBoards(hoveredBoard).length > 0 && (
        <>
          {isMobile ? (
            <MobileBottomSheet
              hoveredBoard={hoveredBoard}
              boardName={sortedTopBoards.find(board => board.id === hoveredBoard)?.name || '게시판 이동'}
              boardSlug={sortedTopBoards.find(board => board.id === hoveredBoard)?.slug || hoveredBoard}
              childBoards={getChildBoards(hoveredBoard)}
              currentBoardId={currentBoardId}
              onClose={() => setHoveredBoard(null)}
            />
          ) : (
            /* 데스크톱 2열 리스트 드롭다운 */
            <div
              ref={menuRef}
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleMenuClose}
              className="absolute bg-white dark:bg-[#1D1D1D] shadow-lg border border-gray-200 dark:border-[#444444] z-[100] rounded-lg w-[280px] animate-in fade-in slide-in-from-top-1 duration-150"
              style={{
                left: `${menuPosition.left}px`,
                top: `${menuPosition.top + 2}px`,
              }}
            >
              {createListLayout(getChildBoards(hoveredBoard))}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (plain) {
    return content;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4 overflow-visible">
      {content}
    </Container>
  );
}

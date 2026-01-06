'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChildBoard, TopBoard, HoverMenuProps, MobileBottomSheet } from './hover-menu';

export default function HoverMenu({
  currentBoardId,
  topBoards,
  childBoardsMap,
  rootBoardId,
  rootBoardSlug
}: HoverMenuProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [visibleBoards, setVisibleBoards] = useState<TopBoard[]>([]);
  const [hiddenBoards, setHiddenBoards] = useState<TopBoard[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 상위 게시판 정렬 - 불필요한 재계산 방지를 위한 메모이제이션
  const sortedTopBoards = useMemo(() => 
    [...topBoards].sort((a, b) =>
      a.display_order !== b.display_order
        ? a.display_order - b.display_order
        : a.name.localeCompare(b.name)
    ), [topBoards]);

  // topBoards가 변경될 때 초기 상태 설정
  useEffect(() => {
    if (sortedTopBoards.length > 0) {
      const mobile = window.innerWidth < 768;
      
      if (mobile) {
        const maxVisibleBoards = 3;
        
        if (sortedTopBoards.length <= maxVisibleBoards) {
          setVisibleBoards(sortedTopBoards);
          setHiddenBoards([]);
        } else {
          setVisibleBoards(sortedTopBoards.slice(0, maxVisibleBoards));
          setHiddenBoards(sortedTopBoards.slice(maxVisibleBoards));
        }
      } else {
        setVisibleBoards(sortedTopBoards);
        setHiddenBoards([]);
      }
    }
  }, [sortedTopBoards]);

  // 모바일 환경 체크 및 보이는/숨겨진 게시판 계산
  useEffect(() => {
    let isResizing = false;
    let rafId: number | null = null;
    
    const checkMobileAndCalculateVisibleBoards = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // 모바일에서는 최대 3개까지만 표시
        const maxVisibleBoards = 3;
        
        if (sortedTopBoards.length <= maxVisibleBoards) {
          setVisibleBoards(sortedTopBoards);
          setHiddenBoards([]);
        } else {
          const visible = sortedTopBoards.slice(0, maxVisibleBoards);
          const hidden = sortedTopBoards.slice(maxVisibleBoards);
          setVisibleBoards(visible);
          setHiddenBoards(hidden);
        }
      } else {
        // 데스크톱에서는 모든 게시판 표시
        setVisibleBoards(sortedTopBoards);
        setHiddenBoards([]);
      }
    };
    
    // 최초 체크
    checkMobileAndCalculateVisibleBoards();
    
    // requestAnimationFrame을 사용한 최적화된 리사이즈 핸들러
    const optimizedResize = () => {
      if (!isResizing) {
        isResizing = true;
        
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
          checkMobileAndCalculateVisibleBoards();
          isResizing = false;
          rafId = null;
        });
      }
    };
    
    window.addEventListener('resize', optimizedResize, { passive: true });
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', optimizedResize);
    };
  }, [sortedTopBoards]);

  // 마우스가 메뉴 영역을 벗어날 때 지연 시간 후 닫기
  const handleMenuClose = useCallback(() => {
    // 이미 타이머가 설정되어 있다면 초기화
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    // 다음 렌더링 프레임에서 타이머 설정하여 성능 개선
    requestAnimationFrame(() => {
      closeTimeoutRef.current = setTimeout(() => {
        setHoveredBoard(null);
        closeTimeoutRef.current = null;
      }, 250);
    });
  }, []);
  
  // 마우스가 메뉴 영역으로 들어오면 닫기 타이머 취소
  const handleMenuEnter = useCallback((boardId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (hoveredBoard !== boardId) {
      setHoveredBoard(boardId);
    }
  }, [hoveredBoard]);

  // 모바일 드롭다운 토글
  const toggleMobileDropdown = useCallback(() => {
    setMobileDropdownOpen(!mobileDropdownOpen);
  }, [mobileDropdownOpen]);

  // 모바일에서 하위 메뉴 클릭 처리
  const handleMobileSubmenuClick = useCallback((boardId: string) => (e: React.MouseEvent) => {
    if (isMobile && childBoardsMap[boardId]?.length > 0) {
      e.preventDefault();
      
      // 이미 열린 메뉴를 다시 클릭하면 닫기
      if (hoveredBoard === boardId) {
        setHoveredBoard(null);
        return;
      }
      
      setHoveredBoard(boardId);
    }
  }, [isMobile, childBoardsMap, hoveredBoard]);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setHoveredBoard(null);
      setMobileDropdownOpen(false);
    }
  }, []);

  // 문서 클릭 이벤트 핸들러 등록
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick, { passive: true });
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [handleOutsideClick]);

  // 모바일에서 바텀시트 열릴 때 body 스크롤 막기 (스크롤 위치 보존)
  useEffect(() => {
    if (isMobile && hoveredBoard && childBoardsMap[hoveredBoard]?.length > 0) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // body 스크롤 막기 및 위치 고정
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      // cleanup 시 스크롤 위치 복원
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    } else {
      // 바텀시트가 닫힌 경우 스타일 리셋
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isMobile, hoveredBoard, childBoardsMap]);

  // 메뉴 위치 설정 - 호버된 보드가 바뀔 때만 실행
  useEffect(() => {
    if (!hoveredBoard || !menuItemsRef.current[hoveredBoard]) return;
    
    // DOM 읽기 작업을 requestAnimationFrame으로 최적화
    requestAnimationFrame(() => {
      const menuItem = menuItemsRef.current[hoveredBoard];
      if (menuItem) {
        const parentLeft = menuItem.offsetLeft;
        setMenuPosition({ left: parentLeft });
      }
    });
  }, [hoveredBoard]);

  // 하위 메뉴 그리드로 나누기
  const createGridLayout = useCallback((childBoards: ChildBoard[]) => {
    const sortedChildBoards = [...childBoards].sort((a: ChildBoard, b: ChildBoard) =>
      a.display_order !== b.display_order
        ? a.display_order - b.display_order
        : a.name.localeCompare(b.name)
    );

    // 카테고리 개수에 따라 그리드 열 수 결정 (최대 5개)
    const gridCols = Math.min(sortedChildBoards.length, 5);
    const gridColsClass = `grid-cols-${gridCols}`;

    return (
      <div className={`grid ${gridColsClass}`}>
        {sortedChildBoards.map((childBoard: ChildBoard, index: number) => (
          <Link
            href={`/boards/${childBoard.slug || childBoard.id}`}
            key={childBoard.id}
            className={`px-3 py-2.5 text-[10px] sm:text-xs text-center transition-colors text-gray-900 dark:text-[#F0F0F0] whitespace-nowrap overflow-hidden text-ellipsis border-b border-r border-black/5 dark:border-white/10 ${
              childBoard.id === currentBoardId
                ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                : 'bg-white dark:bg-[#1D1D1D] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
            onClick={() => setHoveredBoard(null)}
            title={childBoard.name}
          >
            {childBoard.name}
          </Link>
        ))}
      </div>
    );
  }, [currentBoardId]);

  const getChildBoards = useCallback((boardId: string) => {
    return childBoardsMap[boardId] || [];
  }, [childBoardsMap]);

  // 메뉴 UI 렌더링
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg mb-4 border border-black/7 dark:border-0">
      <div className="px-4 py-2.5 relative" ref={containerRef}>
        {/* 네비게이션 바 */}
        <nav className="flex items-center justify-between gap-1" ref={navRef}>
          {/* 게시판 목록 */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {/* 전체 버튼 - 최상위 게시판으로 이동하도록 수정 */}
            <Link
              href={`/boards/${rootBoardSlug || rootBoardId}`}
              data-board="all"
              className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 ${
                !currentBoardId ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
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

            {/* 보이는 상위 게시판들 */}
            {visibleBoards.map((topBoard) => (
              <div
                key={topBoard.id}
                className="relative"
                ref={(el) => {
                  menuItemsRef.current[topBoard.id] = el;
                }}
                onMouseEnter={() => !isMobile && handleMenuEnter(topBoard.id)}
                onMouseLeave={(e) => {
                  if (isMobile) return;
                  
                  // dropdown 영역으로 진입하지 않으면 닫기
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
                  className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 ${
                    topBoard.id === currentBoardId
                      ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                      : ''
                  }`}
                  onClick={handleMobileSubmenuClick(topBoard.id)}
                >
                  {topBoard.name}
                  {childBoardsMap[topBoard.id]?.length > 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
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
            ))}
          </div>

          {/* 드롭다운 버튼 (숨겨진 게시판이 있을 때만) - 오른쪽 고정 */}
          {hiddenBoards.length > 0 && (
            <button
              onClick={toggleMobileDropdown}
              data-dropdown-toggle
              className="flex items-center justify-center px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  mobileDropdownOpen ? 'rotate-180' : ''
                }`}
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
            </button>
          )}
        </nav>

        {/* 숨겨진 게시판들을 위한 드롭다운 메뉴 */}
        {mobileDropdownOpen && hiddenBoards.length > 0 && (
          <div className="mt-2 pt-2 border-t border-black/7 dark:border-white/10">
            <div className="flex flex-wrap gap-1">
              {hiddenBoards.map((topBoard) => (
                <div
                  key={topBoard.id}
                  className="relative"
                  ref={(el) => {
                    menuItemsRef.current[topBoard.id] = el;
                  }}
                  onMouseEnter={() => !isMobile && handleMenuEnter(topBoard.id)}
                  onMouseLeave={(e) => {
                    if (isMobile) return;
                    
                    // dropdown 영역으로 진입하지 않으면 닫기
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
                    className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 ${
                      topBoard.id === currentBoardId
                        ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                        : ''
                    }`}
                    onClick={handleMobileSubmenuClick(topBoard.id)}
                  >
                    {topBoard.name}
                    {childBoardsMap[topBoard.id]?.length > 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
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
              ))}
            </div>
          </div>
        )}
        
        {/* 하위 메뉴 (호버 메뉴) */}
        {hoveredBoard && getChildBoards(hoveredBoard).length > 0 && (
          <>
            {/* 모바일 바텀시트 */}
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
              /* 데스크톱 호버 메뉴 */
              <div
                ref={menuRef}
                onMouseEnter={() => handleMenuEnter(hoveredBoard)}
                onMouseLeave={() => handleMenuClose()}
                className="absolute bg-white dark:bg-[#1D1D1D] shadow-lg border border-black/7 dark:border-white/10 z-40 top-[100%] -mt-1 overflow-hidden"
                style={{ 
                  left: `${menuPosition.left}px`, 
                  marginTop: '-7px', 
                  borderRadius: '0.5rem',
                  minWidth: `${Math.min(getChildBoards(hoveredBoard).length, 5) * 100}px`,
                  maxWidth: '700px'
                }}
              >
                {createGridLayout(getChildBoards(hoveredBoard))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
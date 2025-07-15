'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface HoverMenuProps {
  currentBoardId: string;
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  rootBoardId: string;
  activeTabId?: string;
  rootBoardSlug?: string;
  currentBoardSlug?: string;
  fromParam?: string;
}

export default function HoverMenu({
  currentBoardId,
  topBoards,
  childBoardsMap,
  rootBoardId
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

  // 모바일에서 바텀시트 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isMobile && hoveredBoard && childBoardsMap[hoveredBoard]?.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
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
    const ITEMS_PER_ROW = isMobile ? 2 : 5; // 모바일에서는 2개씩, 데스크톱에서는 5개씩
    const sortedChildBoards = [...childBoards].sort((a: ChildBoard, b: ChildBoard) =>
      a.display_order !== b.display_order
        ? a.display_order - b.display_order
        : a.name.localeCompare(b.name)
    );

    // 행 단위로 분할
    const rows: ChildBoard[][] = [];
    for (let i = 0; i < sortedChildBoards.length; i += ITEMS_PER_ROW) {
      rows.push(sortedChildBoards.slice(i, i + ITEMS_PER_ROW));
    }

    return (
      <div className="grid gap-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={`flex gap-1 ${isMobile ? 'flex-col' : ''}`}>
            {row.map((childBoard: ChildBoard) => (
              <Link
                href={`/boards/${childBoard.slug || childBoard.id}`}
                key={childBoard.id}
                className={`inline-block px-3 py-2 text-sm hover:bg-gray-50 rounded-md whitespace-nowrap ${
                  childBoard.id === currentBoardId
                    ? 'bg-blue-50 text-blue-600'
                    : ''
                }`}
                onClick={() => setHoveredBoard(null)}
              >
                {childBoard.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  }, [currentBoardId, isMobile]);

  const getChildBoards = useCallback((boardId: string) => {
    return childBoardsMap[boardId] || [];
  }, [childBoardsMap]);

  // 메뉴 UI 렌더링
  return (
    <div className="bg-white border rounded-lg shadow-sm mb-4">
      <div className="px-4 py-2 relative" ref={containerRef}>
        {/* 네비게이션 바 */}
        <nav className="flex items-center" ref={navRef}>
          {/* 전체 버튼 */}
          <Link
            href={`/boards/${rootBoardId}`}
            data-board="all"
            className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md ${
              !currentBoardId ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
            </span>
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
                className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                  topBoard.id === currentBoardId
                    ? 'bg-gray-100 text-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={handleMobileSubmenuClick(topBoard.id)}
              >
                {topBoard.name}
                {childBoardsMap[topBoard.id]?.length > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 ml-1"
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

          {/* 드롭다운 버튼 (숨겨진 게시판이 있을 때만) */}
          {hiddenBoards.length > 0 && (
            <button
              onClick={toggleMobileDropdown}
              data-dropdown-toggle
              className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md ml-2"
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
          <div className="mt-2 pt-2 border-t border-gray-200">
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
                    className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                      topBoard.id === currentBoardId
                        ? 'bg-gray-100 text-blue-600'
                        : 'text-gray-500'
                    }`}
                    onClick={handleMobileSubmenuClick(topBoard.id)}
                  >
                    {topBoard.name}
                    {childBoardsMap[topBoard.id]?.length > 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 ml-1"
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
              <>
                {/* 오버레이 */}
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-50"
                  onClick={() => setHoveredBoard(null)}
                />
                
                {/* 바텀시트 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg z-50 animate-slide-up">
                  {/* 헤더 */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sortedTopBoards.find(board => board.id === hoveredBoard)?.name || '게시판 이동'}
                    </h3>
                    <button
                      onClick={() => setHoveredBoard(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 콘텐츠 */}
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {getChildBoards(hoveredBoard)
                        .sort((a, b) => (a.display_order !== b.display_order ? a.display_order - b.display_order : a.name.localeCompare(b.name)))
                        .map((childBoard: ChildBoard) => (
                          <Link
                            href={`/boards/${childBoard.slug || childBoard.id}`}
                            key={childBoard.id}
                            className={`block px-4 py-3 text-base hover:bg-gray-50 rounded-lg border ${
                              childBoard.id === currentBoardId
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'border-gray-200'
                            }`}
                            onClick={() => setHoveredBoard(null)}
                          >
                            {childBoard.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 데스크톱 호버 메뉴 */
              <div
                ref={menuRef}
                onMouseEnter={() => handleMenuEnter(hoveredBoard)}
                onMouseLeave={() => handleMenuClose()}
                className="absolute bg-white shadow-md border rounded-b-lg z-40 p-3 top-[100%] max-w-[600px] min-w-[300px] -mt-1"
                style={{ left: `${menuPosition.left}px`, marginTop: '-7px' }}
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
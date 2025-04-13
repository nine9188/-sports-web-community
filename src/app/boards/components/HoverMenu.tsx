'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';

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
}

export default function HoverMenu({
  currentBoardId,
  topBoards,
  childBoardsMap,
  rootBoardId,
  activeTabId,
  rootBoardSlug,
  currentBoardSlug,
}: HoverMenuProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [clickedMobileMenu, setClickedMobileMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (currentBoardSlug) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`현재 게시판: ${currentBoardSlug}`);
      }
    }
  }, [currentBoardSlug]);

  // 마우스가 메뉴 영역을 벗어날 때 지연 시간 후 닫기
  const handleMenuClose = () => {
    // 이미 타이머가 설정되어 있다면 초기화
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    // 250ms 후에 메뉴 닫기
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      closeTimeoutRef.current = null;
    }, 250);
  };
  
  // 마우스가 메뉴 영역으로 들어오면 닫기 타이머 취소
  const handleMenuEnter = (boardId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setHoveredBoard(boardId);
  };

  // 모바일에서 메뉴 클릭 처리
  const handleMobileMenuClick = (boardId: string) => (e: React.MouseEvent) => {
    if (isMobile && childBoardsMap[boardId]?.length > 0) {
      e.preventDefault();
      
      // 이미 열린 메뉴를 다시 클릭하면 닫기
      if (clickedMobileMenu === boardId) {
        setClickedMobileMenu(null);
        return;
      }
      
      setClickedMobileMenu(boardId);
    }
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setHoveredBoard(null);
      setClickedMobileMenu(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (hoveredBoard && menuItemsRef.current[hoveredBoard]) {
      const menuItem = menuItemsRef.current[hoveredBoard];
      if (menuItem) {
        const parentLeft = menuItem.offsetLeft;
        setMenuPosition({ left: parentLeft });
      }
    }
  }, [hoveredBoard]);

  const sortedTopBoards = [...topBoards].sort((a, b) =>
    a.display_order !== b.display_order
      ? a.display_order - b.display_order
      : a.name.localeCompare(b.name)
  );

  // 하위 메뉴 그리드로 나누기
  const createGridLayout = (childBoards: ChildBoard[]) => {
    const ITEMS_PER_ROW = 5; // 한 줄에 5개씩
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
          <div key={rowIndex} className="flex gap-1">
            {row.map((childBoard: ChildBoard) => (
              <Link
                href={`/boards/${childBoard.slug || childBoard.id}`}
                key={childBoard.id}
                className={`inline-block px-3 py-2 text-sm hover:bg-gray-50 rounded-md whitespace-nowrap ${
                  childBoard.id === currentBoardId
                    ? 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                {childBoard.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-4">
      <div className="p-4 relative" ref={containerRef}>
        {/* 네비게이션 바 */}
        <nav className="flex overflow-x-auto">
          <Link
            href={`/boards/${rootBoardSlug || rootBoardId}`}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md ${
              currentBoardId === rootBoardId ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
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

          {sortedTopBoards.map((topBoard) => (
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
                // menuRef나 현재 상태의 hoveredBoard와 관련된 요소로 이동하는 경우에는 닫지 않음
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
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                  topBoard.id === currentBoardId || topBoard.id === activeTabId
                    ? 'bg-gray-100 text-blue-600'
                    : 'text-gray-500'
                }`}
                onClick={handleMobileMenuClick(topBoard.id)}
              >
                {topBoard.name}
                {childBoardsMap[topBoard.id]?.length > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3 w-3 ml-1 transition-transform ${
                      isMobile && clickedMobileMenu === topBoard.id ? 'rotate-180' : ''
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
                )}
              </Link>
            </div>
          ))}
        </nav>
        
        {/* 모바일 드롭다운 메뉴 - 메뉴 위에 떠있는 형태 */}
        {isMobile && clickedMobileMenu && childBoardsMap[clickedMobileMenu] && childBoardsMap[clickedMobileMenu].length > 0 && (
          <div 
            className="absolute z-50 shadow-lg bg-white rounded-md border w-full left-0"
            style={{ top: `calc(100% + 5px)` }}
          >
            <div className="p-3">
              <div className="flex flex-col space-y-1">
                {childBoardsMap[clickedMobileMenu]
                  .sort((a: ChildBoard, b: ChildBoard) =>
                    a.display_order !== b.display_order
                      ? a.display_order - b.display_order
                      : a.name.localeCompare(b.name)
                  )
                  .map((childBoard: ChildBoard) => (
                    <Link
                      href={`/boards/${childBoard.slug || childBoard.id}`}
                      key={childBoard.id}
                      className={`px-3 py-2 text-sm hover:bg-gray-100 rounded-md ${
                        childBoard.id === currentBoardId
                          ? 'bg-blue-50 text-blue-600'
                          : ''
                      }`}
                    >
                      {childBoard.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 데스크톱 호버 메뉴 */}
        {!isMobile && hoveredBoard && childBoardsMap[hoveredBoard]?.length > 0 && (
          <div
            ref={menuRef}
            onMouseEnter={() => handleMenuEnter(hoveredBoard)}
            onMouseLeave={handleMenuClose}
            className="absolute top-[100%] bg-white shadow-md border rounded-b-lg z-50 p-3 -mt-1 max-w-[600px] min-w-[300px]"
            style={{ left: `${menuPosition.left}px`, marginTop: '-7px' }}
          >
            {createGridLayout(childBoardsMap[hoveredBoard])}
          </div>
        )}
      </div>
    </div>
  );
}
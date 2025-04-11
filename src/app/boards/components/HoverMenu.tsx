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
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0 });

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

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setHoveredBoard(null);
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
              onMouseEnter={() => handleMenuEnter(topBoard.id)}
              onMouseLeave={(e) => {
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
        </nav>

        {/* 드롭다운 메뉴 */}
        {hoveredBoard && childBoardsMap[hoveredBoard]?.length > 0 && (
          <div
            ref={menuRef}
            onMouseEnter={() => handleMenuEnter(hoveredBoard)}
            onMouseLeave={handleMenuClose}
            className="absolute top-[100%] bg-white shadow-md border rounded-b-lg z-50 p-2 -mt-1 overflow-x-auto"
            style={{ left: `${menuPosition.left}px`, marginTop: '-7px' }}
          >
            <div className="flex flex-nowrap gap-1">
              {childBoardsMap[hoveredBoard]
                .sort((a, b) =>
                  a.display_order !== b.display_order
                    ? a.display_order - b.display_order
                    : a.name.localeCompare(b.name)
                )
                .map((childBoard) => (
                  <Link
                    href={`/boards/${childBoard.slug || childBoard.id}`}
                    key={childBoard.id}
                    className={`inline-block px-4 py-2 text-sm hover:bg-gray-50 rounded-md whitespace-nowrap mx-1 ${
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
        )}
      </div>
    </div>
  );
}
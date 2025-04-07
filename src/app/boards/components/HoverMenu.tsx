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
  currentBoardSlug?: string;
  rootBoardSlug?: string;
}

export default function HoverMenu({ 
  currentBoardId, 
  topBoards, 
  childBoardsMap, 
  rootBoardId,
  activeTabId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBoardSlug,
  rootBoardSlug
}: HoverMenuProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  
  // 마우스가 메뉴 아이템과 드롭다운 사이의 간격을 이동할 때 메뉴가 사라지는 것을 방지
  const [isMouseInDropdown, setIsMouseInDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuItemMouseEnter = (boardId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredBoard(boardId);
  };

  const handleMenuItemMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isMouseInDropdown) {
        setHoveredBoard(null);
      }
    }, 100); // 100ms 딜레이 추가
  };

  const handleDropdownMouseEnter = () => {
    setIsMouseInDropdown(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    setIsMouseInDropdown(false);
    setHoveredBoard(null);
  };

  useEffect(() => {
    if (hoveredBoard && menuItemsRef.current[hoveredBoard]) {
      const menuItem = menuItemsRef.current[hoveredBoard];
      if (menuItem) {
        const parentLeft = menuItem.offsetLeft;
        setMenuPosition({ left: parentLeft });
      }
    }
  }, [hoveredBoard]);
  
  // display_order 기준으로 상위 게시판 정렬
  const sortedTopBoards = [...topBoards].sort((a, b) => {
    // 먼저 display_order로 정렬
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    // 동일한 display_order 값을 가질 경우 이름으로 정렬
    return a.name.localeCompare(b.name);
  });
  
  // 상위 메뉴가 없으면 빈 메뉴바만 표시
  if (!sortedTopBoards || sortedTopBoards.length === 0) {
    return (
      <div className="relative">
        <nav className="flex overflow-x-auto border-b">
          <Link 
            href={`/boards/${rootBoardSlug}`} 
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap hover:bg-gray-50 ${
              currentBoardId === rootBoardId ? 'bg-gray-100 text-blue-600' : ''
            }`}
          >
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              전체
            </span>
          </Link>
        </nav>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {/* 네비게이션 바 */}
      <nav className="flex overflow-x-auto border-b">
        {/* 홈/전체 메뉴 - 루트 게시판의 slug 사용 */}
        <Link 
          href={`/boards/${rootBoardSlug}`} 
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap hover:bg-gray-50 ${
            currentBoardId === rootBoardId ? 'bg-gray-100 text-blue-600' : ''
          }`}
        >
          <span className="inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            전체
          </span>
        </Link>
        
        {/* 상위 메뉴 항목들 */}
        {sortedTopBoards.map((topBoard) => (
          <div 
            key={topBoard.id} 
            className="relative"
            ref={(el) => {
              menuItemsRef.current[topBoard.id] = el;
              return undefined;
            }}
            onMouseEnter={() => handleMenuItemMouseEnter(topBoard.id)}
            onMouseLeave={handleMenuItemMouseLeave}
          >
            <Link 
              href={`/boards/${topBoard.slug || topBoard.id}`}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap hover:bg-gray-50 flex items-center ${
                topBoard.id === currentBoardId || topBoard.id === activeTabId ? 'bg-gray-100 text-blue-600' : ''
              }`}
            >
              {topBoard.name}
              {childBoardsMap[topBoard.id] && childBoardsMap[topBoard.id].length > 0 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
          </div>
        ))}
      </nav>

      {/* 드롭다운 메뉴 */}
      {hoveredBoard && childBoardsMap[hoveredBoard] && childBoardsMap[hoveredBoard].length > 0 && (
        <div 
          ref={menuRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          className="absolute top-full bg-white shadow-md border rounded z-50 p-2 mt-0.5 overflow-x-auto"
          style={{ left: `${menuPosition.left}px` }}
        >
          <div className="flex flex-nowrap">
            {[...childBoardsMap[hoveredBoard]]
              .sort((a, b) => {
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order;
                }
                return a.name.localeCompare(b.name);
              })
              .map((childBoard) => (
                <Link 
                  href={`/boards/${childBoard.slug || childBoard.id}`}
                  key={childBoard.id}
                  className={`inline-block px-3 py-1.5 text-sm hover:bg-gray-50 rounded whitespace-nowrap mx-1 ${
                    childBoard.id === currentBoardId ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {childBoard.name}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
} 
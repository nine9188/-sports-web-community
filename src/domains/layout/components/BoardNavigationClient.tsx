'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ShoppingBag } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { Board } from '../types/board';

// Props 타입 정의
interface BoardNavigationClientProps {
  boards: Board[];
}

// 개별 게시판 아이템 컴포넌트 - 메모이제이션
const BoardItem = React.memo(function BoardItem({ 
  board, 
  level = 0,
  onItemClick 
}: { 
  board: Board; 
  level?: number;
  onItemClick?: () => void;
}) {
  return (
    <div key={board.id}>
      <Link 
        href={`/boards/${board.slug || board.id}`}
        className="w-full px-3 py-1.5 hover:bg-gray-100 flex items-center text-sm"
        onClick={(e) => {
          e.stopPropagation();
          onItemClick?.();
        }}
      >
        <div className="flex items-center" style={{ marginLeft: `${level * 12}px` }}>
          <span className="text-gray-400 mr-1.5">
            {level > 0 ? '┗' : ''}
          </span>
          <span className={`${level === 0 ? 'font-medium' : ''}`}>
            {board.name || '게시판'}
          </span>
        </div>
      </Link>
      
      {board.children && board.children.length > 0 && 
        board.children
          .sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={level + 1} 
              onItemClick={onItemClick}
            />
          ))
      }
    </div>
  );
});

// 드롭다운 메뉴 컴포넌트 - 메모이제이션
const DropdownMenu = React.memo(function DropdownMenu({ 
  board, 
  position, 
  onClose 
}: { 
  board: Board; 
  position: { top: number; left: number };
  onClose: () => void;
}) {
  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '240px',
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 50
      }}
      onMouseLeave={onClose}
    >
      {/* 메인 게시판 링크 */}
      <Link 
        href={`/boards/${board.slug || board.id}`}
        className="block px-3 py-1.5 text-primary text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
        onClick={onClose}
      >
        <div className="flex items-center">
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          <span>{board.name || '게시판'} 메인 페이지</span>
        </div>
      </Link>
      
      {/* 하위 게시판 목록 */}
      <div className="py-0.5">
        {board.children && board.children.length > 0 ? (
          board.children
            .sort((a, b) => a.display_order - b.display_order)
            .map(child => (
              <BoardItem 
                key={child.id} 
                board={child} 
                level={0} 
                onItemClick={onClose}
              />
            ))
        ) : (
          <div className="px-3 py-1.5 text-sm text-gray-500 italic">
            하위 게시판이 없습니다
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});

// 최상위 게시판 링크 컴포넌트 - 메모이제이션
const TopLevelBoard = React.memo(function TopLevelBoard({ 
  board,
  onHover,
  onLeave,
  onClick
}: { 
  board: Board;
  onHover: (boardId: string, element: HTMLDivElement) => void;
  onLeave: () => void;
  onClick: (board: Board) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={ref}
      className="relative shrink-0 snap-center"
      onMouseEnter={() => ref.current && onHover(board.id, ref.current)}
      onMouseLeave={onLeave}
    >
      <div 
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 cursor-pointer whitespace-nowrap"
        onClick={() => onClick(board)}
      >
        {board.name || '게시판'}
        {board.children && board.children.length > 0 && (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </div>
    </div>
  );
});

// 메인 컴포넌트 - 실제 데이터 사용
function BoardNavigationClient({ boards }: BoardNavigationClientProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 호버 시작 처리
  const handleMouseEnter = (boardId: string, element: HTMLDivElement) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setHoveredBoard(boardId);
    }, 100);
  };

  // 호버 종료 처리
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      setDropdownPosition(null);
    }, 200);
  };

  // 게시판 클릭 처리
  const handleBoardClick = (board: Board) => {
    if (!board.children || board.children.length === 0) {
      router.push(`/boards/${board.slug || board.id}`);
    }
  };

  // 드롭다운 닫기
  const closeDropdown = () => {
    setHoveredBoard(null);
    setDropdownPosition(null);
  };

  // 현재 호버된 게시판 찾기
  const hoveredBoardData = hoveredBoard ? boards.find(b => b.id === hoveredBoard) : null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar pb-1 snap-x snap-mandatory">
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
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="10 8 16 12 10 16 10 8"></polygon>
        </svg>
        라이브스코어
      </Link>
      
      {/* 아이콘샵 링크 */}
      <Link 
        href="/shop/profile-icons" 
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        아이콘샵
      </Link>

      {/* 드롭다운 메뉴 */}
      {hoveredBoardData && dropdownPosition && (
        <DropdownMenu
          board={hoveredBoardData}
          position={dropdownPosition}
          onClose={closeDropdown}
        />
      )}
    </div>
  );
}

export default BoardNavigationClient;
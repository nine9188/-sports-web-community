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
  onItemClick,
  showSubmenu = false,
  onSubmenuHover,
  onSubmenuLeave
}: { 
  board: Board; 
  level?: number;
  onItemClick?: () => void;
  showSubmenu?: boolean;
  onSubmenuHover?: (board: Board, element: HTMLDivElement) => void;
  onSubmenuLeave?: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = board.children && board.children.length > 0;
  
  return (
    <div key={board.id}>
      <div
        ref={itemRef}
        className="w-full px-3 py-1.5 md:py-1.5 py-2.5 hover:bg-gray-100 flex items-center text-sm cursor-pointer relative"
        onMouseEnter={() => {
          if (hasChildren && showSubmenu && onSubmenuHover && itemRef.current) {
            onSubmenuHover(board, itemRef.current);
          }
        }}
        onMouseLeave={() => {
          if (hasChildren && showSubmenu && onSubmenuLeave) {
            onSubmenuLeave();
          }
        }}
        onClick={(e) => {
          if (!hasChildren) {
            e.stopPropagation();
            onItemClick?.();
          }
        }}
      >
        <div className="flex items-center flex-1" style={{ marginLeft: `${level * 12}px` }}>
          <span className="text-gray-400 mr-1.5">
            {level > 0 ? '┗' : ''}
          </span>
          {!hasChildren ? (
            <Link 
              href={`/boards/${board.slug || board.id}`}
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onItemClick?.();
              }}
            >
              <span className={`${level === 0 ? 'font-medium' : ''}`}>
                {board.name || '게시판'}
              </span>
            </Link>
          ) : (
            <span className={`${level === 0 ? 'font-medium' : ''} flex-1`}>
              {board.name || '게시판'}
            </span>
          )}
          {hasChildren && showSubmenu && (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 ml-1" />
          )}
        </div>
      </div>
      
      {/* 기존 방식의 하위 메뉴 (showSubmenu가 false일 때만) */}
      {!showSubmenu && hasChildren && 
        (board.children
          ?.sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={level + 1} 
              onItemClick={onItemClick}
              showSubmenu={false}
            />
          )))
      }
    </div>
  );
});

// 서브메뉴 컴포넌트
const Submenu = React.memo(function Submenu({
  board,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '200px',
        maxWidth: '200px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 60
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {board.children && board.children.length > 0 ? (
        board.children
          .sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={0} 
              onItemClick={onClose}
              showSubmenu={false}
            />
          ))
      ) : (
        <div className="px-3 py-1.5 text-sm text-gray-500 italic">
          하위 게시판이 없습니다
        </div>
      )}
    </div>,
    document.body
  );
});

// 드롭다운 메뉴 컴포넌트 - 메모이제이션
const DropdownMenu = React.memo(function DropdownMenu({ 
  board, 
  position, 
  onClose,
  onMouseEnter,
  onMouseLeave
}: { 
  board: Board; 
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [submenuBoard, setSubmenuBoard] = useState<Board | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 하위 메뉴가 많은지 확인 (5개 이상이면 서브메뉴 사용)
  const shouldUseSubmenu = (board: Board) => {
    return board.children && board.children.length > 5;
  };

  // 서브메뉴 호버 처리
  const handleSubmenuHover = (childBoard: Board, element: HTMLDivElement) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const submenuWidth = 200;
    const spacing = 5;
    
    // 모바일 감지 (768px 이하)
    const isMobile = viewportWidth <= 768;
    
    let left: number;
    let top: number;
    
    if (isMobile) {
      // 모바일: 아래쪽으로 펼치기
      left = Math.max(10, Math.min(rect.left + window.scrollX, viewportWidth - submenuWidth - 10));
      top = rect.bottom + window.scrollY + spacing;
    } else {
      // 데스크탑: 오른쪽으로 펼치기, 화면 밖으로 나가면 왼쪽으로
      const rightSpace = viewportWidth - rect.right;
      const leftSpace = rect.left;
      
      if (rightSpace >= submenuWidth + spacing) {
        // 오른쪽에 공간이 충분함
        left = rect.right + window.scrollX + spacing;
      } else if (leftSpace >= submenuWidth + spacing) {
        // 왼쪽에 공간이 충분함
        left = rect.left + window.scrollX - submenuWidth - spacing;
      } else {
        // 양쪽 모두 공간이 부족하면 화면 중앙에
        left = (viewportWidth - submenuWidth) / 2;
      }
      
      top = rect.top + window.scrollY;
    }
    
    setSubmenuPosition({ top, left });
    setSubmenuBoard(childBoard);
  };

  // 서브메뉴 호버 종료
  const handleSubmenuLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  // 서브메뉴에 마우스 진입
  const handleSubmenuMouseEnter = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  };

  // 서브메뉴에서 마우스 이탈
  const handleSubmenuMouseLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  const closeSubmenu = () => {
    setSubmenuBoard(null);
    setSubmenuPosition(null);
    onClose();
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '240px',
        maxWidth: '240px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 50
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
                showSubmenu={shouldUseSubmenu(child)}
                onSubmenuHover={handleSubmenuHover}
                onSubmenuLeave={handleSubmenuLeave}
              />
            ))
        ) : (
          <div className="px-3 py-1.5 text-sm text-gray-500 italic">
            하위 게시판이 없습니다
          </div>
        )}
      </div>

      {/* 서브메뉴 */}
      {submenuBoard && submenuPosition && (
        <Submenu
          board={submenuBoard}
          position={submenuPosition}
          onClose={closeSubmenu}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        />
      )}
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
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

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
    const menuWidth = 240;
    const spacing = 10;
    
    // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
    let left = rect.left + window.scrollX;
    
    // 오른쪽으로 넘어가는 경우
    if (left + menuWidth > viewportWidth - spacing) {
      left = viewportWidth - menuWidth - spacing;
    }
    
    // 왼쪽으로 넘어가는 경우
    if (left < spacing) {
      left = spacing;
    }
    
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: left
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
    if (!board.children || board.children.length === 0) {
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
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        />
      )}
    </div>
  );
}

export default BoardNavigationClient;
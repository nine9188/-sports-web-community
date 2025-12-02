'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Board } from '../../types/board';

interface BoardItemProps {
  board: Board;
  level?: number;
  onItemClick?: () => void;
  showSubmenu?: boolean;
  onSubmenuHover?: (board: Board, element: HTMLDivElement) => void;
  onSubmenuLeave?: () => void;
}

const BoardItem = React.memo(function BoardItem({ 
  board, 
  level = 0,
  onItemClick,
  showSubmenu = false,
  onSubmenuHover,
  onSubmenuLeave
}: BoardItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = board.children && board.children.length > 0;
  
  return (
    <div key={board.id}>
      <div
        ref={itemRef}
        className="w-full px-3 py-2.5 md:py-1.5 hover:bg-gray-100 flex items-center text-sm cursor-pointer relative"
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
          e.stopPropagation();
          // 모든 게시판이 클릭 가능하도록 변경
          if (onItemClick) {
            onItemClick();
          } else {
            // onItemClick이 없는 경우 직접 이동
            window.location.href = `/boards/${board.slug || board.id}`;
          }
        }}
      >
        <div className="flex items-center flex-1" style={{ marginLeft: `${level * 12}px` }}>
          <span className="text-gray-400 mr-1.5">
            {level > 0 ? '┗' : ''}
          </span>
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

export default BoardItem; 
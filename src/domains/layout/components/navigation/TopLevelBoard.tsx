'use client';

import React, { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Board } from '../../types/board';

interface TopLevelBoardProps {
  board: Board;
  onHover: (boardId: string, element: HTMLDivElement) => void;
  onLeave: () => void;
  onClick: (board: Board) => void;
}

const TopLevelBoard = React.memo(function TopLevelBoard({
  board,
  onHover,
  onLeave,
  onClick
}: TopLevelBoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = board.children && board.children.length > 0;

  const handleClick = () => {
    // 하위 게시판 여부와 관계없이 클릭 시 이동
    onClick(board);
  };

  return (
    <div
      ref={ref}
      className="relative shrink-0 snap-center"
      onMouseEnter={() => ref.current && hasChildren && onHover(board.id, ref.current)}
      onMouseLeave={onLeave}
    >
      <div
        className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
        onClick={handleClick}
      >
        {board.name || '게시판'}
        {hasChildren && (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </div>
    </div>
  );
});

export default TopLevelBoard; 
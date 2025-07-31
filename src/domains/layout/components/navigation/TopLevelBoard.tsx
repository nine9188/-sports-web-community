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

export default TopLevelBoard; 
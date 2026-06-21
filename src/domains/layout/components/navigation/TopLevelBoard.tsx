'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, Trophy } from 'lucide-react';
import { Board } from '../../types/board';

interface TopLevelBoardProps {
  board: Board;
  href: string;
  onHover: (boardId: string, element: HTMLDivElement) => void;
  onLeave: () => void;
}

const TopLevelBoard = React.memo(function TopLevelBoard({
  board,
  href,
  onHover,
  onLeave
}: TopLevelBoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = board.children && board.children.length > 0;
  const isWorldCup = board.id === 'nav-worldcup';

  return (
    <div
      ref={ref}
      className="relative shrink-0 snap-center"
      onMouseEnter={() => ref.current && hasChildren && onHover(board.id, ref.current)}
      onMouseLeave={onLeave}
    >
      <Link
        href={href}
        prefetch={false}
        className={
          isWorldCup
            ? 'rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[13px] font-semibold text-amber-900 shadow-sm shadow-amber-500/10 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/15 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors'
            : 'px-2 py-1 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors'
        }
      >
        {isWorldCup && <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" aria-hidden="true" />}
        {board.name || '게시판'}
        {isWorldCup && (
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-900 dark:bg-amber-300/20 dark:text-amber-100">
            2026
          </span>
        )}
        {hasChildren && (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </Link>
    </div>
  );
});

export default TopLevelBoard;

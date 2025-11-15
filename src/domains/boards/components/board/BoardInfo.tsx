'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';

interface BoardInfoProps {
  boardName: string;
  boardId: string;
  boardSlug?: string;
  isLoggedIn?: boolean;
  className?: string;
}

export default function BoardInfo({ boardName, boardId, boardSlug, isLoggedIn = false, className = '' }: BoardInfoProps) {
  return (
    <div className={`bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm p-4 ${className}`}>
      {/* 모바일: 게시판 이름 + 글쓰기 아이콘 (한 줄) */}
      <div className="md:hidden flex items-center justify-between">
        <h2 className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{boardName}</h2>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>

      {/* 데스크톱: 게시판 이름 + 글쓰기 버튼 */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{boardName}</h2>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    </div>
  );
}



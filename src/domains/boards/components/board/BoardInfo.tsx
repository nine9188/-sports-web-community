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
    <div className={`bg-white border rounded-md shadow-sm p-4 ${className}`}>
      {/* 모바일: 게시판 이름 + 글쓰기 아이콘 (한 줄) */}
      <div className="md:hidden flex items-center justify-between">
        <h2 className="text-sm font-semibold truncate">{boardName}</h2>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-slate-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PenLine className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* 데스크톱: 게시판 이름 + 글쓰기 버튼 */}
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-xl font-bold">{boardName}</h2>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-full hover:bg-slate-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PenLine className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}



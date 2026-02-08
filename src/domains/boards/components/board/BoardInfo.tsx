'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { Container } from '@/shared/components/ui';

interface BoardInfoProps {
  boardName: string;
  boardId: string;
  boardSlug?: string;
  isLoggedIn?: boolean;
  className?: string;
}

export default function BoardInfo({ boardName, boardId, boardSlug, isLoggedIn = false, className = '' }: BoardInfoProps) {
  return (
    <Container className={`bg-white dark:bg-[#1D1D1D] ${className}`}>
      {/* 통합 레이아웃: 게시판 이름 + 글쓰기 아이콘 */}
      <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
        <h2 className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{boardName}</h2>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    </Container>
  );
}



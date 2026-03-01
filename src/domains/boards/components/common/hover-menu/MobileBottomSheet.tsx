'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { ChildBoard, TopBoard } from './types';

interface MobileBottomSheetProps {
  hoveredBoard: string;
  boardName: string;
  boardSlug: string;
  childBoards: ChildBoard[];
  currentBoardId: string;
  onClose: () => void;
}

export default function MobileBottomSheet({
  hoveredBoard,
  boardName,
  boardSlug,
  childBoards,
  currentBoardId,
  onClose
}: MobileBottomSheetProps) {
  const sortedChildBoards = [...childBoards].sort((a, b) =>
    a.display_order !== b.display_order
      ? a.display_order - b.display_order
      : a.name.localeCompare(b.name)
  );

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1D1D1D] rounded-t-lg z-50 animate-slide-up">
        {/* 헤더 */}
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <h3 className="text-xs sm:text-sm text-gray-900 dark:text-[#F0F0F0]">
            {boardName || '게시판 이동'}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 text-gray-700 dark:text-gray-300"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 콘텐츠 */}
        <div className="max-h-96 overflow-y-auto">
          <Link
            href={`/boards/${boardSlug || hoveredBoard}`}
            prefetch={false}
            className="w-full text-left px-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#1D1D1D] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] block transition-colors border-b border-black/5 dark:border-white/10"
            onClick={onClose}
          >
            {boardName} 게시판 전체 보기
          </Link>
          {sortedChildBoards.map((childBoard: ChildBoard, index: number) => (
            <Link
              href={`/boards/${childBoard.slug || childBoard.id}`}
              prefetch={false}
              key={childBoard.id}
              className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-[#F0F0F0] block transition-colors ${
                index < sortedChildBoards.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
              } ${
                childBoard.id === currentBoardId
                  ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                  : 'bg-white dark:bg-[#1D1D1D] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
              onClick={onClose}
            >
              {childBoard.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react';

interface PostNavigationProps {
  boardSlug: string;
  prevPost: { id: string; title: string; post_number: number } | null;
  nextPost: { id: string; title: string; post_number: number } | null;
  isLoggedIn?: boolean;
}

export default function PostNavigation({ boardSlug, prevPost, nextPost }: PostNavigationProps) {
  // 표시할 버튼들의 배열 생성
  const buttons = [
    // 이전글 버튼 (항상 표시)
    {
      key: 'prev',
      element: prevPost ? (
        <Link 
          href={`/boards/${boardSlug}/${prevPost.post_number}`}
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors px-2 py-1 gap-1"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>이전글</span>
        </Link>
      ) : (
        <button 
          disabled
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed px-2 py-1 gap-1"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>이전글</span>
        </button>
      )
    },
    // 목록 버튼 (항상 표시)
    {
      key: 'list',
      element: (
        <Link 
          href={`/boards/${boardSlug}`}
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors px-2 py-1 gap-1"
        >
          <ListOrdered className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>목록</span>
        </Link>
      )
    },
    // 다음글 버튼 (항상 표시)
    {
      key: 'next',
      element: nextPost ? (
        <Link 
          href={`/boards/${boardSlug}/${nextPost.post_number}`}
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors px-2 py-1 gap-1"
        >
          <span>다음글</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      ) : (
        <button 
          disabled
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed px-2 py-1 gap-1"
        >
          <span>다음글</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 mb-4">
      <div className="h-12 px-4 flex flex-row items-center justify-around">
        {buttons.map((button) => (
          <div key={button.key} className="flex-1 text-center">
            {button.element}
          </div>
        ))}
      </div>
    </div>
  );
} 
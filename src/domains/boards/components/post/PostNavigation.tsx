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
          className="inline-flex flex-col sm:flex-row items-center justify-center py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span>이전글</span>
        </Link>
      ) : (
        <button 
          disabled
          className="inline-flex flex-col sm:flex-row items-center justify-center py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm text-gray-400 cursor-not-allowed"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
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
          className="inline-flex flex-col sm:flex-row items-center justify-center py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ListOrdered className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
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
          className="inline-flex flex-col sm:flex-row items-center justify-center py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:order-last sm:ml-1" />
          <span className="sm:order-first">다음글</span>
        </Link>
      ) : (
        <button 
          disabled
          className="inline-flex flex-col sm:flex-row items-center justify-center py-1 px-1 sm:py-2 sm:px-3 text-xs sm:text-sm text-gray-400 cursor-not-allowed"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:order-last sm:ml-1" />
          <span className="sm:order-first">다음글</span>
        </button>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-4">
      <div className="flex flex-row items-center justify-around px-1 py-2">
        {buttons.map((button) => (
          <div key={button.key} className="flex-1 text-center">
            {button.element}
          </div>
        ))}
      </div>
    </div>
  );
} 
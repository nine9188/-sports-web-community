import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ListOrdered, PenLine } from 'lucide-react';

interface PostNavigationProps {
  boardSlug: string;
  prevPost: { id: string; title: string; post_number: number } | null;
  nextPost: { id: string; title: string; post_number: number } | null;
  isLoggedIn?: boolean;
}

export default function PostNavigation({ boardSlug, prevPost, nextPost, isLoggedIn = false }: PostNavigationProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm mb-6">
      <div className="flex flex-row items-center justify-between px-2 py-2">
        {/* 이전글 버튼 */}
        <div className="flex-1 text-center">
          {prevPost ? (
            <Link 
              href={`/boards/${boardSlug}/${prevPost.post_number}`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">이전글</span>
            </Link>
          ) : (
            <button 
              disabled
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-400 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">이전글</span>
            </button>
          )}
        </div>

        {/* 목록 버튼 */}
        <div className="flex-1 text-center">
          <Link 
            href={`/boards/${boardSlug}`}
            className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ListOrdered className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">목록</span>
          </Link>
        </div>

        {/* 다음글 버튼 */}
        <div className="flex-1 text-center">
          {nextPost ? (
            <Link 
              href={`/boards/${boardSlug}/${nextPost.post_number}`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span className="hidden sm:inline">다음글</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          ) : (
            <button 
              disabled
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-400 cursor-not-allowed"
            >
              <span className="hidden sm:inline">다음글</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {/* 글쓰기 버튼 (모바일에서는 숨김, 로그인 시에만 보임) */}
        <div className="hidden md:block flex-1 text-center">
          {isLoggedIn ? (
            <Link 
              href={`/boards/${boardSlug}/create`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <PenLine className="h-4 w-4 mr-1" />
              <span>글쓰기</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
} 
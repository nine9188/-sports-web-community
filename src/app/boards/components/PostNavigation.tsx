import React from 'react';
import Link from 'next/link';

interface PostNavigationProps {
  boardSlug: string;
  prevPost: { id: string; title: string; post_number: number } | null;
  nextPost: { id: string; title: string; post_number: number } | null;
}

export default function PostNavigation({ boardSlug, prevPost, nextPost }: PostNavigationProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm mb-6">
      <div className="border-b">
        <div className="grid grid-cols-[70px_1fr] items-center py-3 px-4">
          <span className="text-sm text-gray-500">이전글</span>
          {prevPost ? (
            <Link 
              href={`/boards/${boardSlug}/${prevPost.post_number}`}
              className="text-sm hover:underline truncate"
            >
              {prevPost.title}
            </Link>
          ) : (
            <span className="text-sm text-gray-400">이전 게시글이 없습니다.</span>
          )}
        </div>
      </div>
      <div>
        <div className="grid grid-cols-[70px_1fr] items-center py-3 px-4">
          <span className="text-sm text-gray-500">다음글</span>
          {nextPost ? (
            <Link 
              href={`/boards/${boardSlug}/${nextPost.post_number}`}
              className="text-sm hover:underline truncate"
            >
              {nextPost.title}
            </Link>
          ) : (
            <span className="text-sm text-gray-400">다음 게시글이 없습니다.</span>
          )}
        </div>
      </div>
    </div>
  );
} 
'use client';

import React from 'react';
import Link from 'next/link';
import { ListOrdered, PenLine, Edit, Trash } from 'lucide-react';

interface PostFooterProps {
  boardSlug: string;
  postNumber?: string;
  isAuthor?: boolean;
  isLoggedIn?: boolean;
}

export default function PostFooter({ 
  boardSlug,
  postNumber,
  isAuthor = false,
  isLoggedIn = false
}: PostFooterProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm mb-6">
      <div className="flex flex-row items-center justify-between px-2 py-2">
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

        {/* 글쓰기 버튼 (로그인 시에만 보임) */}
        <div className="hidden md:block flex-1 text-center">
          {isLoggedIn ? (
            <Link 
              href={`/boards/${boardSlug}/create`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <PenLine className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">글쓰기</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* 수정 버튼 (작성자만 보임) */}
        <div className="flex-1 text-center">
          {isAuthor && postNumber ? (
            <Link 
              href={`/boards/${boardSlug}/${postNumber}/edit`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">수정</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* 삭제 버튼 (작성자만 보임) */}
        <div className="flex-1 text-center">
          {isAuthor && postNumber ? (
            <Link 
              href={`/boards/${boardSlug}/${postNumber}/delete`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">삭제</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
} 
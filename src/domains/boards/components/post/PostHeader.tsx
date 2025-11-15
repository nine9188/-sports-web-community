'use client';

import React from 'react';
import UserIcon from '@/shared/components/UserIcon';
import { formatDate } from '@/shared/utils/date'; // 공통 유틸로 분리 추천

interface PostHeaderProps {
  title: string;
  author: {
    nickname: string | null;
    id?: string;
    icon_id?: number | null;
    icon_url?: string | null;
  };
  createdAt: string;
  views: number;
  likes: number;
  boardName?: string;
  commentCount?: number;
}

export default function PostHeader({ 
  title, 
  author, 
  createdAt, 
  views, 
  likes, 
  commentCount = 0,
}: PostHeaderProps) {
  const cleanTitle = typeof title === 'string' 
    ? title.replace(/&quot;|"|"|"/g, '"').replace(/&ldquo;|&rdquo;/g, '"') 
    : title;

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10 px-4 py-3">
      <h1 className="text-lg font-medium mb-2 text-gray-900 dark:text-[#F0F0F0]">{cleanTitle}</h1>

      {/* PC */}
      <div className="hidden md:flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center flex-shrink-0">
          <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
            <UserIcon
              iconUrl={author.icon_url}
              size={20}
              alt={author.nickname || '사용자'}
              className="object-cover"
              priority
            />
          </div>
          <span className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{author.nickname || '알 수 없음'}</span>
        </div>

        <div className="flex items-center space-x-4 flex-shrink-0 ml-auto">
          <div className="flex items-center space-x-3">
            <span>조회 {views || 0}</span>
            <span>추천 {likes || 0}</span>
            <span>댓글 {commentCount || 0}</span>
          </div>
          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <div className="flex items-center flex-shrink-0">
            <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
              <UserIcon
                iconUrl={author.icon_url}
                size={20}
                alt={author.nickname || '사용자'}
                className="object-cover"
                priority
              />
            </div>
            <span className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{author.nickname || '알 수 없음'}</span>
          </div>

          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>

        <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span>조회 {views || 0}</span>
            <span>추천 {likes || 0}</span>
            <span>댓글 {commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

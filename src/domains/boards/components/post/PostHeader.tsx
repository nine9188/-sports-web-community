'use client';

import React from 'react';
import UserIcon from '@/shared/components/UserIcon';

interface PostHeaderProps {
  title: string;
  author: {
    nickname: string | null;
    id?: string; // 사용자 ID
    icon_id?: number | null; // 아이콘 ID 추가
    icon_url?: string | null; // 아이콘 URL 추가
  };
  createdAt: string;
  views: number;
  likes: number;
  boardName?: string;
  commentCount?: number; // 댓글 수 추가
}

export default function PostHeader({ 
  title, 
  author, 
  createdAt, 
  views, 
  likes, 
  commentCount = 0, // 기본값 제공
}: PostHeaderProps) {
  // 제목 정리 - 클라이언트 측에서만 적용됨 (replace 메서드 사용)
  const cleanTitle = typeof title === 'string' ? 
    title.replace(/&quot;|"|"|"/g, '"').replace(/&ldquo;|&rdquo;/g, '"') : title;

  // 날짜 포맷 변경
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <div className="border-b px-4 py-3">
      <h1 className="text-lg font-medium mb-2">{cleanTitle}</h1>
      
      {/* PC 버전 (md 이상) - 한 줄에 모든 정보 표시 */}
      <div className="hidden md:flex flex-wrap items-center justify-between text-xs text-gray-500">
        {/* 작성자 정보 - 왼쪽 배치 */}
        <div className="flex items-center flex-shrink-0">
          <div className="w-6 h-6 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
            <UserIcon 
              iconUrl={author.icon_url}
              size={24}
              alt={author.nickname || '사용자'}
              className="object-cover"
              priority={true}
            />
          </div>
          <span className="font-medium text-sm">{author.nickname || '알 수 없음'}</span>
        </div>
        
        {/* 오른쪽 그룹: 조회/추천/댓글/작성시간 */}
        <div className="flex items-center space-x-4 flex-shrink-0 ml-auto">
          <div className="flex items-center space-x-3">
            <span>조회 {views || 0}</span>
            <span>추천 {likes || 0}</span>
            <span>댓글 {commentCount || 0}</span>
          </div>
          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>
      </div>
      
      {/* 모바일 버전 (md 미만) - 두 줄로 정보 표시 */}
      <div className="md:hidden">
        {/* 첫 줄: 작성자(왼쪽)와 작성시간(오른쪽) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mb-1">
          {/* 작성자 정보 - 왼쪽 배치 */}
          <div className="flex items-center flex-shrink-0">
            <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
              <UserIcon 
                iconUrl={author.icon_url}
                size={20}
                alt={author.nickname || '사용자'}
                className="object-cover"
                priority={true}
              />
            </div>
            <span className="font-medium text-sm">{author.nickname || '알 수 없음'}</span>
          </div>
          
          {/* 작성시간 - 오른쪽 배치 */}
          <span className="flex-shrink-0">{formatDate(createdAt)}</span>
        </div>
        
        {/* 두 번째 줄: 조회/추천/댓글 (모바일에서 작성시간 아래, 오른쪽 정렬) */}
        <div className="flex justify-end text-xs text-gray-500">
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
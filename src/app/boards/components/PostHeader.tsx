'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getUserIconInfo } from '@/app/utils/level-icons';

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
  boardName: string;
}

export default function PostHeader({ 
  title, 
  author, 
  createdAt, 
  views, 
  likes, 
  boardName 
}: PostHeaderProps) {
  const [userIconUrl, setUserIconUrl] = useState<string | null>(author.icon_url || null);
  const [iconName, setIconName] = useState<string | null>(null);
  
  // 사용자 아이콘 가져오기
  useEffect(() => {
    const fetchUserIcon = async () => {
      // 이미 아이콘 URL이 있으면 다시 가져오지 않음
      if (userIconUrl || !author.id) return;
      
      try {
        const iconInfo = await getUserIconInfo(author.id);
        
        if (iconInfo) {
          setUserIconUrl(iconInfo.currentIconUrl);
          setIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('아이콘 로딩 오류:', error);
      }
    };
    
    fetchUserIcon();
  }, [author.id, userIconUrl]);
  
  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setUserIconUrl(null);
  };

  return (
    <div className="border-b px-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold mb-2">{title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-4">
              {userIconUrl ? (
                <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0" title={iconName || undefined}>
                  <Image 
                    src={userIconUrl}
                    alt={author.nickname || '사용자'}
                    fill
                    className="object-cover"
                    sizes="20px"
                    unoptimized={true}
                    priority={true}
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="w-5 h-5 mr-1.5 bg-transparent rounded-full flex-shrink-0"></div>
              )}
              <span>{author.nickname || '알 수 없음'}</span>
            </div>
            <span className="mr-4">{new Date(createdAt).toLocaleString('ko-KR')}</span>
            <span className="mr-4">조회: {views || 0}</span>
            <span>추천: {likes || 0}</span>
          </div>
        </div>
        <div>
          <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
            {boardName || '게시판'}
          </span>
        </div>
      </div>
    </div>
  );
} 
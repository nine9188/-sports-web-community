'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsItem } from './news-widget';

interface NewsWidgetClientProps {
  initialNews: NewsItem[];
}

export default function NewsWidgetClient({ initialNews }: NewsWidgetClientProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // 이미지 로드 에러 처리 함수
  const handleImageError = (id: string) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 날짜가 유효하지 않으면 '방금 전' 반환
      if (isNaN(date.getTime())) return '방금 전';
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const newsDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (newsDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (newsDate.getTime() === yesterday.getTime()) {
        return '어제';
      }
      
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } catch {
      return '날짜 정보 없음';
    }
  };

  // 뉴스 없음 상태
  if (!initialNews.length) {
    return (
      <div className="mb-1">
        <div className="flex justify-center items-center h-48 text-muted-foreground bg-gray-50 rounded-lg border p-3">
          표시할 게시글이 없습니다.
        </div>
      </div>
    );
  }

  // 백업 이미지 가져오기
  const getBackupImage = (id: string, index: number) => {
    return `/213/news${(index % 4) + 1}.jpg`;
  };

  return (
    <div className="mb-4">
      {/* 뉴스 레이아웃 - 메인 뉴스 왼쪽, 작은 뉴스 오른쪽 2x2 그리드 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 메인 뉴스 (첫 번째 뉴스) - 왼쪽 배치 */}
        <div className="md:w-1/2">
          <Link
            href={initialNews[0].url}
            className="block h-full mb-1 md:mb-0 bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-1px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
            style={{
              WebkitTapHighlightColor: 'transparent',
              transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
            }}
          >
            <div className="flex flex-col h-full">
              <div className="relative w-full h-full transform transition-transform group-hover:scale-[1.02]">
                <Image
                  src={imageErrors[initialNews[0].id] ? getBackupImage(initialNews[0].id, 0) : (initialNews[0].imageUrl || getBackupImage(initialNews[0].id, 0))}
                  alt={initialNews[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onError={() => handleImageError(initialNews[0].id)}
                />
              </div>
              <div className="p-1 bg-white flex-grow">
                <h3 className="text-base font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {initialNews[0].title}
                </h3>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>{initialNews[0].source}</span>
                  <span>{formatDate(initialNews[0].publishedAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* 작은 뉴스 (나머지 뉴스) - 오른쪽 2x2 그리드 */}
        <div className="md:w-1/2">
          <div className="grid grid-cols-2 gap-4 h-full">
            {initialNews.slice(1, 5).map((item, index) => (
              <Link
                key={item.id}
                href={item.url}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-2px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="relative w-full h-32 transform transition-transform group-hover:scale-[1.02]">
                    <Image
                      src={imageErrors[item.id] ? getBackupImage(item.id, index + 1) : (item.imageUrl || getBackupImage(item.id, index + 1))}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onError={() => handleImageError(item.id)}
                    />
                  </div>
                  <div className="p-2 flex-grow flex flex-col">
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
                      {item.title}
                    </h3>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span className="truncate max-w-[70px]">{item.source}</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsItem } from './news-widget';

interface NewsWidgetClientProps {
  initialNews: NewsItem[];
}

// 이미지 로딩 상태 타입
type ImageLoadingState = 'loading' | 'loaded' | 'error' | 'timeout';

export default function NewsWidgetClient({ initialNews }: NewsWidgetClientProps) {
  const [imageStates, setImageStates] = useState<Record<string, ImageLoadingState>>({});
  const [isClient, setIsClient] = useState(false); // 🔧 클라이언트 렌더링 확인용
  const [news, setNews] = useState<NewsItem[]>([]); // 🔧 뉴스 데이터 상태 추가
  const [isLoading, setIsLoading] = useState(true); // 🔧 로딩 상태 추가
  
  // 백업 이미지 목록 (더 다양하게)
  const backupImages = [
    '/213/news1.jpg',
    '/213/news2.jpg', 
    '/213/news3.jpg',
    '/213/news4.jpg'
  ];
  
  // 🔧 클라이언트 렌더링 확인 - Hydration 불일치 방지
  useEffect(() => {
    setIsClient(true);
    setNews(initialNews); // 클라이언트에서만 데이터 설정
    setIsLoading(false);
  }, [initialNews]);
  
  // 이미지 상태 업데이트 함수
  const updateImageState = useCallback((id: string, state: ImageLoadingState) => {
    setImageStates(prev => ({
      ...prev,
      [id]: state
    }));
  }, []);

  // 이미지 로딩 타임아웃 처리
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {};
    
    news.forEach(item => {
      if (item.imageUrl && !item.imageUrl.startsWith('/213/')) {
        // 외부 이미지의 경우 10초 타임아웃 설정 (더 여유롭게)
        timeouts[item.id] = setTimeout(() => {
          setImageStates(prev => {
            if (prev[item.id] === 'loading') {
              console.warn(`이미지 로딩 타임아웃: ${item.imageUrl}`);
              return { ...prev, [item.id]: 'timeout' };
            }
            return prev;
          });
        }, 10000); // 5초에서 10초로 증가
      }
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [news]);
  
  // 이미지 로드 에러 처리 함수
  const handleImageError = useCallback((id: string) => {
    console.warn(`이미지 로딩 실패: ${id}`);
    updateImageState(id, 'error');
  }, [updateImageState]);

  // 이미지 로딩 시작 처리
  const handleImageLoadStart = useCallback((id: string) => {
    updateImageState(id, 'loading');
  }, [updateImageState]);

  // 이미지 로딩 완료 처리
  const handleImageLoad = useCallback((id: string) => {
    updateImageState(id, 'loaded');
  }, [updateImageState]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식 사용
    if (!isClient) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        // 서버에서는 YYYY-MM-DD 형식으로 고정
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '-';
      }
    }
    
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

  // 백업 이미지 가져오기
  const getBackupImage = (id: string, index: number) => {
    return backupImages[index % backupImages.length];
  };

  // 안전한 이미지 URL 가져오기
  const getSafeImageUrl = (item: NewsItem, index: number) => {
    const state = imageStates[item.id];
    
    // 에러나 타임아웃이 발생한 경우에만 백업 이미지 사용
    if (state === 'error' || state === 'timeout') {
      return getBackupImage(item.id, index);
    }
    
    // 원본 이미지 URL이 있으면 우선 사용 (외부 URL 포함)
    if (item.imageUrl) {
      return item.imageUrl;
    }
    
    // 이미지 URL이 없으면 백업 이미지 사용
    return getBackupImage(item.id, index);
  };

  // 로딩 상태 확인
  const isImageLoading = (id: string) => {
    return imageStates[id] === 'loading';
  };

  // 뉴스 없음 상태
  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="mb-1">
        <div className="flex justify-center items-center h-48 text-muted-foreground bg-gray-50 rounded-lg border p-3">
          표시할 게시글이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* 뉴스 레이아웃 - 메인 뉴스 왼쪽, 작은 뉴스 오른쪽 2x2 그리드 */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 min-h-[300px] md:min-h-[420px]">
        {/* 메인 뉴스 (첫 번째 뉴스) - 왼쪽 배치 */}
        <div className="md:w-1/2 h-auto md:h-full">
          <Link
            href={news[0].url}
            className="block h-full mb-1 md:mb-0 bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-1px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
            style={{
              WebkitTapHighlightColor: 'transparent',
              transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
            }}
          >
            <div className="flex flex-col h-full">
              {/* 🔧 큰 뉴스 이미지 높이를 더 길게 조정 */}
              <div className="relative w-full h-56 md:h-80 lg:h-96 transform transition-transform group-hover:scale-[1.02]">
                {/* 로딩 스피너 */}
                {isImageLoading(news[0].id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <Image
                  src={getSafeImageUrl(news[0], 0)}
                  alt={String(news[0]?.title || '뉴스 이미지')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onLoad={() => handleImageLoad(news[0].id)}
                  onLoadStart={() => handleImageLoadStart(news[0].id)}
                  onError={() => handleImageError(news[0].id)}
                  // 이미지 로딩 최적화
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
              <div className="p-3 bg-white flex-grow">
                <h3 className="text-base md:text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {String(news[0]?.title || '제목 없음')}
                </h3>
                <div className="flex justify-between items-center text-xs md:text-sm text-gray-500 mt-2">
                  <span>{String(news[0]?.source || '출처 없음')}</span>
                  <span>{formatDate(news[0]?.publishedAt || '')}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* 작은 뉴스 (나머지 뉴스) - 오른쪽 2x2 그리드 */}
        <div className="md:w-1/2 h-auto md:h-full">
          <div className="grid grid-cols-2 gap-2 md:gap-4 h-full">
            {news.slice(1, 5).map((item, index) => (
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
                  {/* 🔧 작은 뉴스 이미지 높이 조정 - 2x2 그리드에서 균형 맞춤 */}
                  <div className="relative w-full h-28 md:h-36 lg:h-40 transform transition-transform group-hover:scale-[1.02]">
                    {/* 로딩 스피너 */}
                    {isImageLoading(item.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="animate-spin rounded-full h-4 w-4 md:h-6 md:w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <Image
                      src={getSafeImageUrl(item, index + 1)}
                      alt={String(item?.title || '뉴스 이미지')}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      // 이미지 로딩 최적화
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                  <div className="p-1.5 md:p-2 flex-grow flex flex-col">
                    <h3 className="text-xs md:text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">
                      {String(item?.title || '제목 없음')}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-500 mt-1">
                      <span className="truncate max-w-[50px] md:max-w-[70px]">{String(item?.source || '출처 없음')}</span>
                      <span>{formatDate(item?.publishedAt || '')}</span>
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
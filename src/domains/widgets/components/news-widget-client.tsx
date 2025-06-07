'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

interface NewsWidgetClientProps {
  initialNews: NewsItem[];
}

type ImageLoadingState = 'loading' | 'loaded' | 'error' | 'timeout';

export default function NewsWidgetClient({ initialNews }: NewsWidgetClientProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isLoading, setIsLoading] = useState(false);
  const [imageStates, setImageStates] = useState<Record<string, ImageLoadingState>>({});

  // 이미지 로딩 상태 관리
  const handleImageLoadStart = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'loading' }));
    
    // 타임아웃 설정 (5초)
    setTimeout(() => {
      setImageStates(prev => {
        if (prev[id] === 'loading') {
          return { ...prev, [id]: 'timeout' };
        }
        return prev;
      });
    }, 5000);
  }, []);

  const handleImageLoad = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'loaded' }));
  }, []);

  const handleImageError = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'error' }));
  }, []);

  // 백그라운드에서 뉴스 업데이트 (5분마다)
  useEffect(() => {
    const updateNews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/news');
        if (response.ok) {
          const newNews = await response.json();
          setNews(newNews);
        }
      } catch (error) {
        console.error('뉴스 업데이트 실패:', error);
        // 에러 발생 시 기존 데이터 유지
      } finally {
        setIsLoading(false);
      }
    };

    // 5분마다 업데이트
    const interval = setInterval(updateNews, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return diffInMinutes <= 0 ? '방금' : `${diffInMinutes}분 전`;
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else if (diffInHours < 48) {
        return '어제';
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
          return `${diffInDays}일 전`;
        } else {
          return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
          });
        }
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return '';
    }
  };

  // 백업 이미지 생성
  const getBackupImage = (id: string, index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    const color = colors[index % colors.length];
    return `data:image/svg+xml;base64,${btoa(`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-family="Arial">뉴스</text></svg>`)}`;
  };

  const getSafeImageUrl = (item: NewsItem, index: number) => {
    // 이미지 URL이 있고 유효한 경우
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
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
      
      {/* 추가 뉴스 섹션 - 2열 5행 그리드 (10개) */}
      {news.length > 5 && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {news.slice(5, 15).map((item, index) => (
              <Link
                key={item.id}
                href={item.url}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-2px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translate3d(0,0,0)'
                }}
              >
                <div className="flex h-full">
                  {/* 텍스트 섹션 - 왼쪽 */}
                  <div className="flex-1 p-3 flex flex-col justify-between min-h-[80px] md:min-h-[96px]">
                    <h4 className="text-sm md:text-base font-medium line-clamp-3 group-hover:text-blue-600 transition-colors mb-2">
                      {String(item?.title || '제목 없음')}
                    </h4>
                    <div className="flex flex-col gap-1 text-xs text-gray-500 mt-auto">
                      <span className="truncate">{String(item?.source || '출처 없음')}</span>
                      <span>{formatDate(item?.publishedAt || '')}</span>
                    </div>
                  </div>
                  
                  {/* 이미지 섹션 - 오른쪽 (전체 높이 꽉 채움) */}
                  <div className="relative w-20 md:w-24 h-full flex-shrink-0 transform transition-transform group-hover:scale-[1.02]">
                    {/* 로딩 스피너 */}
                    {isImageLoading(item.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <Image
                      src={getSafeImageUrl(item, index + 5)}
                      alt={String(item?.title || '뉴스 이미지')}
                      fill
                      className="object-cover rounded-r-lg"
                      sizes="100px"
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
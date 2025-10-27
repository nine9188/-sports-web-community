'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/shared/utils/date';

// ==================== 타입 정의 ====================
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

// ==================== 상수 ====================
const IMAGE_TIMEOUT_MS = 5000;
const BACKUP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

const CARD_STYLES = {
  base: "bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-2px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]",
  transform: {
    WebkitTapHighlightColor: 'transparent',
    transform: 'translate3d(0,0,0)'
  }
} as const;

// ==================== 유틸리티 함수 ====================
const getBackupImage = (id: string, index: number): string => {
  const color = BACKUP_COLORS[index % BACKUP_COLORS.length];
  return `data:image/svg+xml;base64,${btoa(`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-family="Arial">뉴스</text></svg>`)}`;
};

const getSafeImageUrl = (item: NewsItem, index: number): string => {
  if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
    return item.imageUrl;
  }
  return getBackupImage(item.id, index);
};

// ==================== 서브 컴포넌트 ====================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4 md:h-6 md:w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

interface NewsImageProps {
  item: NewsItem;
  index: number;
  isLoading: boolean;
  onLoad: () => void;
  onLoadStart: () => void;
  onError: () => void;
  priority?: boolean;
  sizes: string;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
}

const NewsImage = ({
  item,
  index,
  isLoading,
  onLoad,
  onLoadStart,
  onError,
  priority = false,
  sizes,
  className = "object-cover",
  spinnerSize = 'md'
}: NewsImageProps) => (
  <>
    {isLoading && <LoadingSpinner size={spinnerSize} />}
    <Image
      src={getSafeImageUrl(item, index)}
      alt={String(item?.title || '뉴스 이미지')}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onLoad={onLoad}
      onLoadStart={onLoadStart}
      onError={onError}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  </>
);

// ==================== 메인 컴포넌트 ====================
export default function NewsWidgetClient({ initialNews }: NewsWidgetClientProps) {
  const [news] = useState<NewsItem[]>(initialNews);
  const [imageStates, setImageStates] = useState<Record<string, ImageLoadingState>>({});

  // 이미지 로딩 핸들러
  const handleImageLoadStart = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'loading' }));

    setTimeout(() => {
      setImageStates(prev =>
        prev[id] === 'loading' ? { ...prev, [id]: 'timeout' } : prev
      );
    }, IMAGE_TIMEOUT_MS);
  }, []);

  const handleImageLoad = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'loaded' }));
  }, []);

  const handleImageError = useCallback((id: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'error' }));
  }, []);

  const isImageLoading = (id: string) => imageStates[id] === 'loading';

  // 뉴스 없음 상태
  if (!news.length) {
    return (
      <div className="mb-2">
        <div className="flex justify-center items-center h-48 text-muted-foreground bg-gray-50 rounded-lg border p-3">
          표시할 게시글이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* 메인 레이아웃: 메인 뉴스(왼쪽) + 작은 뉴스 2x2 그리드(오른쪽) */}
      <div className="flex flex-col md:flex-row min-h-[300px] md:min-h-[420px]">

        {/* 메인 뉴스 (첫 번째) */}
        <div className="md:w-1/2 h-auto md:h-full mb-2 md:mb-0 md:mr-2">
          <Link
            href={news[0].url}
            className="block h-full bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group hover:translate-y-[-1px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
            style={CARD_STYLES.transform}
          >
            <div className="flex flex-col h-full">
              <div className="relative w-full h-56 md:h-80 lg:h-96 transform transition-transform group-hover:scale-[1.02]">
                <NewsImage
                  item={news[0]}
                  index={0}
                  isLoading={isImageLoading(news[0].id)}
                  onLoad={() => handleImageLoad(news[0].id)}
                  onLoadStart={() => handleImageLoadStart(news[0].id)}
                  onError={() => handleImageError(news[0].id)}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  spinnerSize="lg"
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

        {/* 작은 뉴스 2x2 (2~5번째) */}
        <div className="md:w-1/2 flex flex-col">
          {/* 위쪽 2개 */}
          <div className="flex flex-1 mb-2">
            {news.slice(1, 3).map((item, index) => (
              <Link
                key={item.id}
                href={item.url}
                className={`${CARD_STYLES.base} flex-1 ${index === 0 ? 'mr-2' : ''}`}
                style={CARD_STYLES.transform}
              >
                <div className="flex flex-col h-full">
                  <div className="relative w-full flex-1 transform transition-transform group-hover:scale-[1.02]">
                    <NewsImage
                      item={item}
                      index={index + 1}
                      isLoading={isImageLoading(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      spinnerSize="md"
                    />
                  </div>
                  <div className="p-1.5 md:p-2">
                    <h3 className="text-xs md:text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {String(item?.title || '제목 없음')}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-500 mt-2">
                      <span className="truncate max-w-[50px] md:max-w-[70px]">{String(item?.source || '출처 없음')}</span>
                      <span>{formatDate(item?.publishedAt || '')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 아래쪽 2개 */}
          <div className="flex flex-1">
            {news.slice(3, 5).map((item, index) => (
              <Link
                key={item.id}
                href={item.url}
                className={`${CARD_STYLES.base} flex-1 ${index === 0 ? 'mr-2' : ''}`}
                style={CARD_STYLES.transform}
              >
                <div className="flex flex-col h-full">
                  <div className="relative w-full flex-1 transform transition-transform group-hover:scale-[1.02]">
                    <NewsImage
                      item={item}
                      index={index + 3}
                      isLoading={isImageLoading(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      spinnerSize="md"
                    />
                  </div>
                  <div className="p-1.5 md:p-2">
                    <h3 className="text-xs md:text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {String(item?.title || '제목 없음')}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-500 mt-2">
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

      {/* 추가 뉴스 2열 리스트 (6~15번째) */}
      {news.length > 5 && (
        <div className="mt-2 flex flex-col md:flex-row md:flex-wrap">
          {news.slice(5, 15).map((item, index) => {
            const isLastRow = index >= 8;
            const isLeftColumn = index % 2 === 0;
            return (
              <Link
                key={item.id}
                href={item.url}
                className={`${CARD_STYLES.base} w-full md:w-[calc(50%-4px)] ${isLeftColumn ? 'md:mr-2' : ''} ${isLastRow ? 'mb-0' : 'mb-2'}`}
                style={CARD_STYLES.transform}
              >
              <div className="flex h-full">
                {/* 텍스트 영역 (왼쪽) */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <h4 className="text-sm md:text-base font-medium line-clamp-3 group-hover:text-blue-600 transition-colors mb-2">
                    {String(item?.title || '제목 없음')}
                  </h4>
                  <div className="flex flex-col text-xs text-gray-500">
                    <span className="truncate">{String(item?.source || '출처 없음')}</span>
                    <span>{formatDate(item?.publishedAt || '')}</span>
                  </div>
                </div>

                {/* 이미지 영역 (오른쪽) */}
                <div className="relative w-20 md:w-24 h-full flex-shrink-0 transform transition-transform group-hover:scale-[1.02]">
                  <NewsImage
                    item={item}
                    index={index + 5}
                    isLoading={isImageLoading(item.id)}
                    onLoad={() => handleImageLoad(item.id)}
                    onLoadStart={() => handleImageLoadStart(item.id)}
                    onError={() => handleImageError(item.id)}
                    sizes="100px"
                    className="object-cover rounded-r-lg"
                    spinnerSize="sm"
                  />
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/shared/utils/dateUtils';
import { siteConfig } from '@/shared/config';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { NewsItem } from './types';

// ==================== 타입 정의 ====================
interface NewsWidgetClientProps {
  initialNews: NewsItem[];
}

type ImageLoadingState = 'loading' | 'loaded' | 'error' | 'timeout';

// ==================== 상수 ====================
const IMAGE_TIMEOUT_MS = 5000;
const FALLBACK_LOGO = siteConfig.logo;

const CARD_STYLES = {
  base: "bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group touch-manipulation",
  transform: {
    WebkitTapHighlightColor: 'transparent',
    transform: 'translate3d(0,0,0)'
  }
} as const;

// ==================== 유틸리티 함수 ====================
const hasValidImageUrl = (item: NewsItem): boolean => {
  return !!(item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim());
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
    <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5] dark:bg-[#262626] z-10">
      <div className={`animate-spin rounded-full border-b-2 border-gray-900 dark:border-[#F0F0F0] ${sizeClasses[size]}`}></div>
    </div>
  );
};

interface NewsImageProps {
  item: NewsItem;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onLoadStart: () => void;
  onError: () => void;
  priority?: boolean;
  sizes: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
}

const NewsImage = ({
  item,
  isLoading,
  hasError,
  onLoad,
  onLoadStart,
  onError,
  priority = false,
  sizes,
  spinnerSize = 'md'
}: NewsImageProps) => {
  // 이미지 URL이 없거나 에러가 발생한 경우 fallback 사용
  const useFallback = !hasValidImageUrl(item) || hasError;
  const imageUrl = useFallback ? FALLBACK_LOGO : item.imageUrl!;

  return (
    <>
      {isLoading && <LoadingSpinner size={spinnerSize} />}
      <Image
        src={imageUrl}
        alt={String(item?.title || '뉴스 이미지')}
        fill
        unoptimized  // 외부 이미지 도메인 제한 해제
        className={useFallback
          ? "object-contain p-4 dark:invert transition-all"
          : "object-cover transition-all"
        }
        sizes={sizes}
        priority={priority}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        onError={onError}
        data-nosnippet="true"  // 검색 크롤러가 OG 이미지로 선택하지 않도록
        data-pinterest-nopin="true"  // Pinterest 크롤링 방지
        loading={priority ? undefined : "lazy"}  // 우선순위 없으면 lazy loading
      />
      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all pointer-events-none" />
    </>
  );
};

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
  const hasImageError = (id: string) => imageStates[id] === 'error' || imageStates[id] === 'timeout';

  // 뉴스 없음 상태
  if (!news.length) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>뉴스</ContainerTitle>
        </ContainerHeader>
        <div className="flex justify-center items-center h-32 text-center">
          <p className="text-gray-500 dark:text-gray-400">아직 게시글이 없습니다.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>뉴스</ContainerTitle>
      </ContainerHeader>
      <div className="p-4">
      {/* 메인 레이아웃: 큰 배너(왼쪽) + 세로 카드 3개(오른쪽) */}
      <div className="flex flex-col md:flex-row mb-4 gap-4">
        {/* 큰 배너 (첫 번째) - 왼쪽 */}
        <div className="md:w-1/2">
          <Link
            href={news[0].url}
            className="block bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group touch-manipulation h-full"
            style={CARD_STYLES.transform}
          >
            <div className="flex flex-col h-full">
              <div className="relative w-full h-48 md:h-56 bg-[#F5F5F5] dark:bg-[#262626]">
                <NewsImage
                  item={news[0]}
                  isLoading={isImageLoading(news[0].id)}
                  hasError={hasImageError(news[0].id)}
                  onLoad={() => handleImageLoad(news[0].id)}
                  onLoadStart={() => handleImageLoadStart(news[0].id)}
                  onError={() => handleImageError(news[0].id)}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  spinnerSize="lg"
                />
              </div>
              <div className="p-3 bg-white dark:bg-[#1D1D1D] flex-grow">
                <h3 className="text-xs md:text-sm font-semibold line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">
                  {String(news[0]?.title || '제목 없음')}
                </h3>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{String(news[0]?.source || '출처 없음')}</span>
                  <span>{formatDate(news[0]?.publishedAt || '')}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 세로 카드 3개 (2~4번째) - 오른쪽 */}
        {news.length > 1 && (
          <div className="md:w-1/2 flex flex-col gap-4">
            {news.slice(1, 4).map((item) => (
              <Link
                key={item.id}
                href={item.url}
                className={CARD_STYLES.base}
                style={CARD_STYLES.transform}
              >
                <div className="flex h-full">
                  {/* 텍스트 영역 (왼쪽) */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <h4 className="text-xs md:text-sm font-medium line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors mb-2">
                      {String(item?.title || '제목 없음')}
                    </h4>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate max-w-[120px]">{String(item?.source || '출처 없음')}</span>
                      <span>{formatDate(item?.publishedAt || '')}</span>
                    </div>
                  </div>

                  {/* 이미지 영역 (오른쪽) */}
                  <div className="relative w-24 md:w-28 aspect-[1/1] md:aspect-auto md:h-auto flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] rounded-r-lg overflow-hidden">
                    <NewsImage
                      item={item}
                      isLoading={isImageLoading(item.id)}
                      hasError={hasImageError(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      sizes="(max-width: 768px) 100px, 120px"
                      spinnerSize="sm"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 추가 뉴스 2열 리스트 (5~14번째) */}
      {news.length > 4 && (
        <div className="flex flex-col md:flex-row md:flex-wrap">
          {news.slice(4, 14).map((item, index) => {
            const isLeftColumn = index % 2 === 0;
            const isLastRow = index >= 8; // 마지막 2개 아이템
            return (
              <Link
                key={item.id}
                href={item.url}
                className={`${CARD_STYLES.base} w-full md:w-[calc(50%-8px)] ${isLeftColumn ? 'md:mr-4' : ''} ${isLastRow ? 'mb-0' : 'mb-4'}`}
                style={CARD_STYLES.transform}
              >
                <div className="flex h-full">
                  {/* 텍스트 영역 (왼쪽) */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <h4 className="text-xs md:text-sm font-medium line-clamp-2 text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors mb-2">
                      {String(item?.title || '제목 없음')}
                    </h4>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate max-w-[120px]">{String(item?.source || '출처 없음')}</span>
                      <span>{formatDate(item?.publishedAt || '')}</span>
                    </div>
                  </div>

                  {/* 이미지 영역 (오른쪽) */}
                  <div className="relative w-24 md:w-28 aspect-[1/1] md:aspect-auto md:h-auto flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] rounded-r-lg overflow-hidden">
                    <NewsImage
                      item={item}
                      isLoading={isImageLoading(item.id)}
                      hasError={hasImageError(item.id)}
                      onLoad={() => handleImageLoad(item.id)}
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onError={() => handleImageError(item.id)}
                      sizes="(max-width: 768px) 100px, 120px"
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
    </Container>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageType } from '@/shared/types/image';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';

// 메모리 캐시 - 이미 확인된 URL들을 저장하여 중복 요청 방지
export const urlCache = new Map<string, string | null>();

type SizeVariant = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type ShapeVariant = 'square' | 'circle';

interface UnifiedSportsImageProps extends Omit<ImageProps, 'src' | 'width' | 'height'> {
  imageId: string | number;
  imageType: ImageType;
  alt: string;
  size?: SizeVariant;
  variant?: ShapeVariant;
  showFallback?: boolean;
  fallbackContent?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fit?: 'cover' | 'contain';
}

/**
 * 통일된 스포츠 이미지 컴포넌트
 * 
 * 특징:
 * - 팀 로고, 선수, 감독 이미지를 동일한 구조로 처리
 * - size와 variant로 모든 케이스 커버
 * - 공통 로딩 애니메이션
 * - 일관된 폴백 시스템
 */
export default function UnifiedSportsImage({
  imageId,
  imageType,
  alt,
  size = 'md',
  variant = 'square',
  showFallback = true,
  fallbackContent,
  loading = 'lazy',
  priority = false,
  className = '',
  fit = 'cover',
  ...props
}: UnifiedSportsImageProps) {
  // 상태 관리
  const [src, setSrc] = useState<string | null>(null);
  const [hasTriedServerAction, setHasTriedServerAction] = useState(false);

  // 크기 맵핑
  const sizeClasses = {
    sm: 'w-6 h-6',    // 24px - 팀 로고
    md: 'w-8 h-8',    // 32px - 선수
    lg: 'w-10 h-10',  // 40px - 감독
    xl: 'w-12 h-12',  // 48px - 큰 아바타
    xxl: 'w-28 h-28'  // 112px - 모달 대형 아바타
  };

  const sizeValues = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
    xxl: { width: 112, height: 112 }
  };

  // 모양 맵핑
  const shapeClasses = {
    square: 'rounded',
    circle: 'rounded-full'
  };


  // 이미지 URL 로드
  useEffect(() => {
    const cacheKey = `${imageType}-${imageId}`;
    
    // 메모리 캐시에서 먼저 확인
    if (urlCache.has(cacheKey)) {
      const cachedUrl = urlCache.get(cacheKey);
      setSrc(cachedUrl || null);
      return;
    }

    // 직접 스토리지 URL 시도
    const directStorageUrl = getSupabaseStorageUrl(imageType, imageId);
    urlCache.set(cacheKey, directStorageUrl);
    setSrc(directStorageUrl);
  }, [imageId, imageType]);

  // 이미지 로드 에러 시 서버 액션으로 캐싱 시도
  const handleImageError = async () => {
    if (hasTriedServerAction) {
      setSrc(null);
      return;
    }

    setHasTriedServerAction(true);
    
    try {
      const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
      const result = await getCachedImageFromStorage(
        imageType as 'players' | 'teams' | 'leagues' | 'coachs' | 'venues', 
        imageId
      );
      
      if (result.success && result.url && result.url.includes('supabase.co')) {
        const cacheKey = `${imageType}-${imageId}`;
        urlCache.set(cacheKey, result.url);
        setSrc(result.url);
      } else {
        setSrc(null);
      }
    } catch (error) {
      console.debug(`이미지 서버 액션 실패: ${imageType}/${imageId}`, error);
      setSrc(null);
    }
  };

  // 컨테이너 클래스 생성
  const containerClasses = [
    sizeClasses[size],
    shapeClasses[variant],
    'relative',
    'flex-shrink-0',
    'overflow-hidden',
    'bg-transparent',
    variant === 'circle' ? 'border-2 border-gray-200 dark:border-gray-700' : '',
    className
  ].filter(Boolean).join(' ');

  // src가 null이면 폴백 콘텐츠만 표시 (로딩 없음)
  if (!src) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        {showFallback && fallbackContent ? fallbackContent : null}
      </div>
    );
  }

  // 이미지 렌더링
  return (
    <div className={containerClasses}>
      <Image
        {...props}
        src={src}
        alt={alt}
        {...sizeValues[size]}
        onError={handleImageError}
        // priority가 true이면 priority만, 아니면 loading만 설정
        {...(priority ? { priority: true } : { loading: loading })}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-300 opacity-0 animate-fade-in`}
        onLoad={(e) => {
          // 이미지 로드 완료 시 페이드인 효과
          const target = e.target as HTMLImageElement;
          target.classList.remove('opacity-0');
          target.classList.add('opacity-100');
        }}
      />
    </div>
  );
}
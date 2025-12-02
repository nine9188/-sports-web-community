'use client';

import { useState, useCallback, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { getFallbackImageUrl, ImageType, getCachedImageUrl } from '@/shared/utils/image-proxy';

// 이미지 타입 추론을 위한 URL 패턴 (enum 기반)
const getImageTypeFromUrl = (url: string): ImageType | null => {
  if (url.includes('/players/')) return ImageType.Players;
  if (url.includes('/teams/')) return ImageType.Teams;
  if (url.includes('/leagues/')) return ImageType.Leagues;
  if (url.includes('/coachs/')) return ImageType.Coachs;
  return null;
};

interface ApiSportsImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackType?: ImageType;
  imageId?: string | number; // API-Sports 이미지 ID (캐싱용)
  imageType?: ImageType; // 이미지 타입 (캐싱용)
}

/**
 * API-Sports 이미지를 표시하는 컴포넌트
 * Supabase Storage 캐싱을 지원하며, 에러 발생 시 폴백 이미지를 표시합니다.
 * 
 * @param src - 이미지 URL
 * @param fallbackType - 에러 시 사용할 폴백 이미지 타입
 * @param imageId - API-Sports 이미지 ID (캐싱용)
 * @param imageType - 이미지 타입 (캐싱용)
 * @param props - 나머지 Image 컴포넌트 props
 */
export default function ApiSportsImage({ 
  src, 
  fallbackType,
  imageId,
  imageType,
  onError,
  alt,
  ...props 
}: ApiSportsImageProps) {
  // Storage URL 우선 시도, 실패하면 원본 URL 사용
  const [currentSrc, setCurrentSrc] = useState(() => {
    // imageId와 imageType이 있으면 Storage URL 먼저 시도
    if (imageId && imageType) {
      return `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/${imageType}/${imageId}.png`;
    }
    return src;
  });
  const [hasError, setHasError] = useState(false);

  // 백그라운드에서 캐시 워밍업 (Storage에 없는 경우에만)
  useEffect(() => {
    if (imageId && imageType && hasError) {
      // Storage URL이 실패한 경우에만 백그라운드에서 캐시
      getCachedImageUrl(imageType, imageId)
        .then(cachedUrl => {
          if (cachedUrl && cachedUrl !== src && cachedUrl.includes('supabase.co')) {
            setCurrentSrc(cachedUrl);
            setHasError(false);
          }
        })
        .catch(error => {
          console.error('Background cache failed:', error);
        });
    }
  }, [hasError, imageId, imageType, src]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      
      // Storage URL 실패 시 원본 API-Sports URL로 먼저 시도
      if (imageId && imageType && currentSrc.includes('supabase.co')) {
        setCurrentSrc(src); // 원본 URL로 변경
        return; // 폴백 이미지로 바로 가지 않음
      }
      
      // 원본 URL도 실패하면 폴백 이미지 설정
      let fallbackType_ = fallbackType;
      if (!fallbackType_) {
        // imageType이 있으면 사용, 없으면 URL에서 타입 추론
        fallbackType_ = imageType || getImageTypeFromUrl(src) || ImageType.Players;
      }
      
      const fallbackUrl = getFallbackImageUrl(fallbackType_);
      setCurrentSrc(fallbackUrl);
    }
    
    // 원본 onError 핸들러 호출
    onError?.(e);
  }, [hasError, fallbackType, imageType, src, onError, imageId, currentSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt || ''}
      onError={handleImageError}
      unoptimized // 외부 이미지이므로 최적화 비활성화
    />
  );
} 
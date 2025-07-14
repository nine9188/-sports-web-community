'use client';

import { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { convertApiSportsUrl, getFallbackImageUrl, isApiSportsUrl, ImageType } from '@/shared/utils/image-proxy';

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
}

/**
 * API-Sports 이미지를 자동으로 Vercel CDN 프록시로 변환하는 컴포넌트
 * 
 * @param src - 원본 이미지 URL (API-Sports URL 또는 일반 URL)
 * @param fallbackType - 에러 시 사용할 폴백 이미지 타입
 * @param props - 나머지 Image 컴포넌트 props
 */
export default function ApiSportsImage({ 
  src, 
  fallbackType,
  onError,
  alt,
  ...props 
}: ApiSportsImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => {
    // API-Sports URL인 경우 프록시 URL로 변환
    return isApiSportsUrl(src) ? convertApiSportsUrl(src) : src;
  });
  
  const [hasError, setHasError] = useState(false);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      
      // 디버깅 로그 추가
      console.warn(`[ApiSportsImage] 이미지 로딩 실패: ${currentSrc}`);
      
      // 폴백 이미지 설정
      let fallbackType_ = fallbackType;
      if (!fallbackType_) {
        // URL에서 타입 추론
        fallbackType_ = getImageTypeFromUrl(src) || ImageType.Players;
      }
      
      const fallbackUrl = getFallbackImageUrl(fallbackType_);
      console.log(`[ApiSportsImage] 폴백 이미지 사용: ${fallbackUrl}`);
      setCurrentSrc(fallbackUrl);
    }
    
    // 원본 onError 핸들러 호출
    onError?.(e);
  }, [hasError, fallbackType, src, onError, currentSrc]);

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
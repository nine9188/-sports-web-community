'use client';

import { useState, useCallback, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageType } from '@/shared/types/image';

interface ApiSportsImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  imageId?: string | number; // API-Sports 이미지 ID
  imageType?: ImageType; // 이미지 타입
}

/**
 * API-Sports 이미지를 표시하는 컴포넌트
 * 스토리지에 있는 이미지만 표시하며, 없으면 즉시 캐싱을 시도합니다.
 * 무조건 Supabase 스토리지 이미지만 사용하고 폴백 이미지는 사용하지 않습니다.
 * 
 * @param src - 스토리지 URL
 * @param imageId - API-Sports 이미지 ID
 * @param imageType - 이미지 타입
 * @param props - 나머지 Image 컴포넌트 props
 */
export default function ApiSportsImage({ 
  src, 
  imageId,
  imageType,
  onError,
  alt,
  ...props 
}: ApiSportsImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isCaching, setIsCaching] = useState(false);

  // 이미지 에러 핸들러
  const handleImageError = useCallback(async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imageId && imageType && currentSrc.includes('supabase.co') && !isCaching) {
      // 스토리지 URL 실패 시 즉시 캐싱 시도
      setIsCaching(true);
      
      try {
        const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
        const result = await getCachedImageFromStorage(imageType as 'players' | 'teams' | 'leagues' | 'coachs' | 'venues', imageId);
        
        if (result.success && result.cached && result.url && result.url.includes('supabase.co')) {
          // 캐싱 성공 시 새로운 스토리지 URL로 교체
          setCurrentSrc(result.url);
          setIsCaching(false);
          return; // 에러 상태로 가지 않음
        }
      } catch (error) {
        console.debug(`이미지 캐싱 실패: ${imageType}/${imageId}`, error);
      }
      
      setIsCaching(false);
    }
    
    // 원본 onError 핸들러 호출
    onError?.(e);
  }, [imageType, onError, imageId, currentSrc, isCaching]);

  // 컴포넌트 마운트 시 스토리지에 없는 이미지 프리캐싱
  useEffect(() => {
    if (imageId && imageType && currentSrc.includes('supabase.co')) {
      // 백그라운드에서 이미지 존재 여부 확인 후 없으면 캐싱
      const preCache = async () => {
        try {
          const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
          
          // 조용히 캐싱 시도 (UI에 영향 없음)
          await getCachedImageFromStorage(imageType as 'players' | 'teams' | 'leagues' | 'coachs' | 'venues', imageId);
        } catch (error) {
          // 무시 (백그라운드 캐싱 실패는 사용자 경험에 영향 없음)
          console.debug(`백그라운드 캐싱 실패: ${imageType}/${imageId}`, error);
        }
      };
      
      // 컴포넌트 마운트 후 잠시 지연하여 캐싱 시작
      const timer = setTimeout(preCache, 500);
      return () => clearTimeout(timer);
    }
  }, [imageId, imageType, currentSrc]);

  return (
    <div className="relative">
      <Image
        {...props}
        src={currentSrc}
        alt={alt || ''}
        onError={handleImageError}
        unoptimized // 외부 이미지이므로 최적화 비활성화
      />
      
      {/* 캐싱 중 로딩 인디케이터 */}
      {isCaching && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
} 
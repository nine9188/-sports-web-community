'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageType } from '@/shared/types/image';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';

// 메모리 캐시 - 이미 확인된 URL들을 저장하여 중복 요청 방지
const urlCache = new Map<string, string | null>();

interface ApiSportsImageProps extends Omit<ImageProps, 'src'> {
  imageId: string | number; // 필수값
  imageType: ImageType; // 필수값
  alt: string;
}

/**
 * API-Sports 이미지를 표시하는 컴포넌트
 * 
 * 핵심 원칙:
 * 1. 먼저 스토리지 URL을 직접 시도 (POST 요청 없음)
 * 2. 이미지 로드 실패 시에만 서버 액션으로 캐싱
 * 3. 메모리 캐시로 중복 요청 방지
 * 4. placeholder/fallback 없이 스토리지 없으면 빈 영역
 * 
 * @param imageId - API-Sports 이미지 ID (필수)
 * @param imageType - 이미지 타입 (필수)
 * @param alt - 대체 텍스트 (필수)
 * @param props - 나머지 Image 컴포넌트 props
 */
export default function ApiSportsImage({ 
  imageId,
  imageType,
  alt,
  loading = 'lazy',
  priority = false,
  ...props 
}: ApiSportsImageProps) {
  // src 상태값 - 초기값을 스토리지 PNG URL로 설정하여 즉시 요청 시작
  const [src, setSrc] = useState<string | null>(() => getSupabaseStorageUrl(imageType, imageId));
  const [hasTriedServerAction, setHasTriedServerAction] = useState(false);

  useEffect(() => {
    const cacheKey = `${imageType}-${imageId}`;

    // 메모리 캐시에서 먼저 확인
    if (urlCache.has(cacheKey)) {
      const cachedUrl = urlCache.get(cacheKey);
      setSrc(cachedUrl || null);
      return;
    }

    // 확장자 우선순위: gif → png
    // public storage URL은 .png 형태이므로 .gif 후보도 함께 구성하여 HEAD로 존재 여부 확인
    const tryResolveUrl = async () => {
      const pngUrl = getSupabaseStorageUrl(imageType, imageId);
      const gifUrl = pngUrl.replace('.png', '.gif');

      const exists = async (url: string) => {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          return res.ok;
        } catch {
          return false;
        }
      };

      const useGif = await exists(gifUrl);
      const finalUrl = useGif ? gifUrl : pngUrl;
      urlCache.set(cacheKey, finalUrl);
      setSrc(finalUrl);
    };

    // 비동기로 실제 존재하는 확장자를 결정
    tryResolveUrl();
  }, [imageId, imageType]);

  // 이미지 로드 에러 시 서버 액션으로 캐싱 시도
  const handleImageError = async () => {
    if (hasTriedServerAction) {
      // 서버 액션도 실패했으면 빈 영역으로 처리
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
        // 서버 액션으로 캐싱 성공
        const cacheKey = `${imageType}-${imageId}`;
        urlCache.set(cacheKey, result.url);
        setSrc(result.url);
      } else {
        // 서버 액션도 실패 시 빈 영역 처리
        setSrc(null);
      }
        } catch (error) {
      console.debug(`이미지 서버 액션 실패: ${imageType}/${imageId}`, error);
      setSrc(null);
        }
      };
      
  // src가 없으면 아무것도 렌더링하지 않음
  if (!src) {
    return null;
  }

  // 스토리지 URL이 확인된 경우에만 이미지 렌더링
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={handleImageError}
      // priority가 true이면 loading 속성을 제거하고, 아니면 lazy loading 사용
      {...(priority ? { priority: true } : { loading: loading })}
      className={props.className}
    />
  );
} 
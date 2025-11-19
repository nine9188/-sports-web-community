'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { useTheme } from 'next-themes';
import { ImageType } from '@/shared/types/image';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';

// 메모리 캐시 - 이미 확인된 URL들을 저장하여 중복 요청 방지
const urlCache = new Map<string, string | null>();

// 다크모드용 이미지가 있는 리그 ID들
const DARK_MODE_LEAGUE_IDS = [39, 2, 3, 848, 179, 88, 119, 98, 292, 66, 13];

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 테마 확인 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  // 다크모드이고 리그 이미지이며 다크모드 이미지가 있는 경우
  const useDarkImage = isDark && imageType === ImageType.Leagues && DARK_MODE_LEAGUE_IDS.includes(Number(imageId));
  const effectiveImageId = useDarkImage ? `${imageId}-1` : imageId;

  // src 상태값 - 초기값을 스토리지 PNG URL로 설정하여 즉시 요청 시작
  const [src, setSrc] = useState<string | null>(() => getSupabaseStorageUrl(imageType, imageId));
  const [hasTriedServerAction, setHasTriedServerAction] = useState(false);

  useEffect(() => {
    const cacheKey = `${imageType}-${effectiveImageId}`;

    // 메모리 캐시에서 먼저 확인
    if (urlCache.has(cacheKey)) {
      const cachedUrl = urlCache.get(cacheKey);
      setSrc(cachedUrl || null);
      return;
    }

    // PNG만 사용 (GIF 체크 제거)
    const pngUrl = getSupabaseStorageUrl(imageType, effectiveImageId);
    urlCache.set(cacheKey, pngUrl);
    setSrc(pngUrl);
  }, [imageId, imageType, effectiveImageId, isDark]);

  // 이미지 로드 에러 시 API-Sports URL로 fallback
  const handleImageError = async () => {
    if (hasTriedServerAction) {
      // 이미 fallback을 시도했으면 API-Sports 직접 URL 사용
      const apiSportsUrl = `https://media.api-sports.io/football/${imageType}/${effectiveImageId}.png`;
      setSrc(apiSportsUrl);
      return;
    }

    setHasTriedServerAction(true);

    try {
      const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
      const result = await getCachedImageFromStorage(
        imageType as 'players' | 'teams' | 'leagues' | 'coachs' | 'venues',
        effectiveImageId
      );

      if (result && result.url) {
        // 서버 액션 성공 (Supabase 또는 API-Sports URL)
        const cacheKey = `${imageType}-${effectiveImageId}`;
        urlCache.set(cacheKey, result.url);
        setSrc(result.url);
      } else {
        // 서버 액션 실패 시 API-Sports 직접 URL
        const apiSportsUrl = `https://media.api-sports.io/football/${imageType}/${effectiveImageId}.png`;
        setSrc(apiSportsUrl);
      }
    } catch {
      // 에러 발생 시 API-Sports 직접 URL
      const apiSportsUrl = `https://media.api-sports.io/football/${imageType}/${effectiveImageId}.png`;
      setSrc(apiSportsUrl);
    }
  };

  // src가 없으면 fallback 이미지 또는 빈 공간
  if (!src) {
    return <div className={props.className} style={{ width: props.width, height: props.height }} />;
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
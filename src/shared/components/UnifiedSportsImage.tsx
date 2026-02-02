'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ImageType } from '@/shared/types/image';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';

// Supabase Storage URL (리그, 팀 이미지용)
const SUPABASE_STORAGE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public';

// API-Sports 이미지 URL (선수, 감독 이미지용)
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football';

/**
 * 이미지 URL 생성
 * - 리그/팀: Supabase Storage에서 로드
 * - 선수/감독: API-Sports에서 로드
 */
function getImageUrl(type: ImageType, id: string | number, isDark: boolean = false): string {
  // 리그와 팀은 Supabase Storage에서 로드
  if (type === ImageType.Leagues || type === ImageType.Teams) {
    const bucket = type === ImageType.Leagues ? 'leagues' : 'teams';

    // 다크모드이고 다크모드 이미지가 있는 리그인 경우 ({id}-1.png 형식)
    if (isDark && type === ImageType.Leagues && DARK_MODE_LEAGUE_IDS.includes(Number(id))) {
      return `${SUPABASE_STORAGE_URL}/${bucket}/${id}-1.png`;
    }

    return `${SUPABASE_STORAGE_URL}/${bucket}/${id}.png`;
  }

  // 선수와 감독은 API-Sports에서 로드
  return `${API_SPORTS_BASE_URL}/${type}/${id}.png`;
}

type SizeVariant = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type ShapeVariant = 'square' | 'circle';

interface UnifiedSportsImageProps {
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
  className?: string;
  showBorder?: boolean; // 테두리 표시 여부
  // ApiSportsImage 호환용 props
  width?: number;
  height?: number;
}

/**
 * 통일된 스포츠 이미지 컴포넌트 (Next.js Image 사용)
 *
 * 이미지 소스:
 * - 리그/팀: Supabase Storage에서 로드 (다크모드 이미지 지원)
 * - 선수/감독: API-Sports에서 로드
 *
 * 특징:
 * - Next.js Image로 자동 최적화 및 CDN 캐싱
 * - size와 variant로 모든 케이스 커버 (또는 width/height 직접 지정)
 * - 다크모드 리그 로고 자동 전환 ({id}-1.png)
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
  showBorder = false,
  fit,
  width,
  height,
}: UnifiedSportsImageProps) {
  // 팀/리그 로고는 기본적으로 contain (잘리면 안 됨), 선수/감독은 cover
  const defaultFit = (imageType === ImageType.Teams || imageType === ImageType.Leagues)
    ? 'contain'
    : 'cover';
  const finalFit = fit ?? defaultFit;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 클라이언트에서만 테마 확인 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // imageId 또는 imageType이 변경되면 에러 상태 리셋
  useEffect(() => {
    setHasError(false);
  }, [imageId, imageType]);

  const isDark = mounted && resolvedTheme === 'dark';

  // 이미지 URL 생성 (리그/팀은 Supabase, 선수/감독은 API-Sports)
  const src = getImageUrl(imageType, imageId, isDark);

  // 크기 맵핑
  const sizeClasses: Record<SizeVariant, string> = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    xxl: 'w-28 h-28'
  };

  const sizeValues: Record<SizeVariant, { width: number; height: number }> = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
    xxl: { width: 112, height: 112 }
  };

  // 모양 맵핑
  const shapeClasses: Record<ShapeVariant, string> = {
    square: 'rounded',
    circle: 'rounded-full'
  };

  // width/height가 직접 지정된 경우 사용, 아니면 size 기반
  const useCustomSize = width !== undefined || height !== undefined;
  const finalWidth = width ?? sizeValues[size].width;
  const finalHeight = height ?? sizeValues[size].height;

  // 테두리 클래스
  const borderClasses = showBorder ? 'border border-black/7 dark:border-white/10' : '';

  // 컨테이너 클래스 생성
  const containerClasses = [
    useCustomSize ? '' : sizeClasses[size],
    shapeClasses[variant],
    'relative',
    'flex-shrink-0',
    'overflow-hidden',
    borderClasses,
    className
  ].filter(Boolean).join(' ');

  // 커스텀 사이즈 스타일
  const containerStyle = useCustomSize ? { width: finalWidth, height: finalHeight } : undefined;

  // 에러 시 폴백 표시
  if (hasError) {
    return (
      <div
        className={`${containerClasses} flex items-center justify-center bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10`}
        style={containerStyle}
      >
        {showFallback && fallbackContent ? fallbackContent : null}
      </div>
    );
  }

  // 모든 이미지에 Next.js Image 사용 (자동 최적화, WebP/AVIF 변환, 리사이징)
  return (
    <div className={containerClasses} style={containerStyle}>
      <Image
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        loading={priority ? undefined : loading}
        onError={() => setHasError(true)}
        className={`w-full h-full ${finalFit === 'contain' ? 'object-contain' : 'object-cover'} ${shapeClasses[variant]}`}
        sizes={`${finalWidth}px`}
      />
    </div>
  );
}

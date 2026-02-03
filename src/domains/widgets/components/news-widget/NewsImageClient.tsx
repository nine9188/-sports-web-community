'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { siteConfig } from '@/shared/config';

const IMAGE_TIMEOUT_MS = 5000;
const FALLBACK_LOGO = siteConfig.logo;

type ImageLoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'timeout';

interface NewsImageClientProps {
  imageUrl?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  spinnerSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4 md:h-6 md:w-6',
  lg: 'h-8 w-8'
};

/**
 * 뉴스 이미지 클라이언트 컴포넌트
 * - 이미지 로딩 상태만 관리
 * - 로딩 스피너 표시
 * - 에러/타임아웃 시 fallback 이미지 사용
 */
export default function NewsImageClient({
  imageUrl,
  alt,
  sizes,
  priority = false,
  spinnerSize = 'md'
}: NewsImageClientProps) {
  const [state, setState] = useState<ImageLoadingState>('idle');

  const hasValidUrl = !!(imageUrl && typeof imageUrl === 'string' && imageUrl.trim());
  const useFallback = !hasValidUrl || state === 'error' || state === 'timeout';
  const finalImageUrl = useFallback ? FALLBACK_LOGO : imageUrl!;

  const handleLoadStart = useCallback(() => {
    setState('loading');
  }, []);

  const handleLoad = useCallback(() => {
    setState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setState('error');
  }, []);

  // 타임아웃 처리
  useEffect(() => {
    if (state !== 'loading') return;

    const timer = setTimeout(() => {
      setState(prev => prev === 'loading' ? 'timeout' : prev);
    }, IMAGE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      {/* 로딩 스피너 */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5] dark:bg-[#262626] z-10">
          <div className={`animate-spin rounded-full border-b-2 border-gray-900 dark:border-[#F0F0F0] ${sizeClasses[spinnerSize]}`} />
        </div>
      )}

      <Image
        src={finalImageUrl}
        alt={alt}
        fill
        unoptimized
        className={useFallback
          ? "object-contain p-4 dark:invert transition-all"
          : "object-cover transition-all"
        }
        sizes={sizes}
        priority={priority}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
        onError={handleError}
        data-nosnippet="true"
        data-pinterest-nopin="true"
        loading={priority ? undefined : "lazy"}
      />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all pointer-events-none" />
    </>
  );
}

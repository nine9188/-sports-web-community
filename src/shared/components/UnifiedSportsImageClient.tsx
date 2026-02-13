'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

type SizeVariant = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type ShapeVariant = 'square' | 'circle';

const MAX_RETRY = 1; // 에러 시 최대 재시도 횟수

interface UnifiedSportsImageClientProps {
  src: string;  // 서버에서 확정된 URL만 받음 (라이트모드 기본)
  srcDark?: string;  // 다크모드용 URL (선택사항)
  alt: string;
  size?: SizeVariant;
  variant?: ShapeVariant;
  showFallback?: boolean;
  fallbackContent?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fit?: 'cover' | 'contain';
  className?: string;
  showBorder?: boolean;
  width?: number;
  height?: number;
}

/**
 * 스포츠 이미지 클라이언트 컴포넌트 (4590 표준)
 *
 * 핵심 규칙:
 * - 이 컴포넌트는 URL을 절대 조합하지 않음
 * - 서버에서 확정된 src만 받아서 렌더링
 * - 로딩/에러/placeholder 처리만 담당
 * - 기본 loading="lazy" (above-the-fold만 eager/priority 사용)
 * - 에러 시 1회 재시도 후 최종 실패 시 placeholder 표시
 */
export default function UnifiedSportsImageClient({
  src,
  srcDark,
  alt,
  size = 'md',
  variant = 'square',
  showFallback = true,
  fallbackContent,
  loading = 'lazy',
  priority = false,
  fit = 'contain',
  className = '',
  showBorder = false,
  width,
  height,
}: UnifiedSportsImageClientProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    // 초기 상태 설정
    setIsDark(document.documentElement.classList.contains('dark'));

    // MutationObserver로 다크모드 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // src가 변경되면 에러/재시도 상태 리셋
  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
  }, [src, srcDark]);

  // 에러 핸들러: 재시도 1회 후 최종 실패
  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRY) {
      setRetryCount(prev => prev + 1);
    } else {
      setHasError(true);
    }
  }, [retryCount]);

  // 다크모드일 때 srcDark가 있으면 사용, 없으면 src 사용
  const effectiveSrc = isDark && srcDark ? srcDark : src;

  // 재시도 시 캐시 무효화를 위한 URL (retryCount가 변경되면 새 요청)
  const srcWithRetry = retryCount > 0
    ? `${effectiveSrc}${effectiveSrc.includes('?') ? '&' : '?'}_r=${retryCount}`
    : effectiveSrc;

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

  return (
    <div className={containerClasses} style={containerStyle}>
      <Image
        src={srcWithRetry}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        loading={priority ? undefined : loading}
        onError={handleError}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${shapeClasses[variant]}`}
        sizes={`${finalWidth}px`}
      />
    </div>
  );
}

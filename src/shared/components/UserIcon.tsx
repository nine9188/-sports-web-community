'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getFallbackIconUrl } from '@/shared/utils/user-icons';
import { getLevelIconUrl } from '@/shared/utils/level-icons';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

// API-Sports URL 유틸리티 함수들
function isApiSportsUrl(url: string): boolean {
  return Boolean(url && url.includes('media.api-sports.io'));
}

function getImageTypeFromUrl(url: string): ImageType | null {
  if (url.includes('/players/')) return ImageType.Players;
  if (url.includes('/teams/')) return ImageType.Teams;
  if (url.includes('/leagues/')) return ImageType.Leagues;
  if (url.includes('/coachs/')) return ImageType.Coachs;
  return null;
}

function getImageIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(players|teams|leagues|coachs|venues)\/(\d+)\.(png|gif)$/);
  return match ? match[2] : null;
}

interface UserIconProps {
  iconUrl?: string | null;
  level?: number;
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

/**
 * 사용자 아이콘 표시를 위한 공통 컴포넌트
 * - iconUrl이 제공되면 해당 아이콘 표시
 * - 에러 발생 또는 iconUrl이 없으면 레벨 기반 아이콘으로 fallback
 * - level 값이 제공되지 않으면 기본값 1 사용
 */
const UserIcon = React.memo(function UserIcon({
  iconUrl,
  level = 1,
  size = 20,
  alt,
  className = '',
  priority = false
}: UserIconProps) {
  const [error, setError] = useState(false);

  // 에러 핸들러 메모이제이션
  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // 아이콘 URL 결정 로직 메모이제이션
  const src = useMemo(() => {
    if (error) return getFallbackIconUrl(level);
    if (!iconUrl) return getLevelIconUrl(level);
    return iconUrl;
  }, [error, iconUrl, level]);

  // 스타일 객체 메모이제이션
  const containerStyle = useMemo(() => ({
    width: size,
    height: size
  }), [size]);

  // sizes 속성 메모이제이션
  const imageSizes = useMemo(() => `${size}px`, [size]);

  const tryRenderApiSports = () => {
    if (!src || !isApiSportsUrl(src)) return null;
    const type = getImageTypeFromUrl(src);
    const id = getImageIdFromUrl(src);
    if (!type || !id) return null;
    return (
      <UnifiedSportsImage
        imageId={id}
        imageType={type as ImageType}
        alt={alt || '유저 아이콘'}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        className="w-full h-full object-contain"
      />
    );
  };

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={containerStyle}
    >
      {tryRenderApiSports() || (
        <Image
          src={src}
          alt={alt || '유저 아이콘'}
          width={size}
          height={size}
          sizes={imageSizes}
          className="w-full h-full object-contain"
          onError={handleError}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      )}
    </div>
  );
});

export default UserIcon; 
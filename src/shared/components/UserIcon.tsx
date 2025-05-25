'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getFallbackIconUrl } from '@/shared/utils/user-icons';
import { getLevelIconUrl } from '@/shared/utils/level-icons';

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
  alt = '유저 아이콘',
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
    if (error) {
      return getFallbackIconUrl(level);
    }
    if (!iconUrl) {
      return getLevelIconUrl(level);
    }
    return iconUrl;
  }, [error, iconUrl, level]);

  // 스타일 객체 메모이제이션
  const containerStyle = useMemo(() => ({
    width: size,
    height: size
  }), [size]);

  // sizes 속성 메모이제이션
  const imageSizes = useMemo(() => `${size}px`, [size]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={containerStyle}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={imageSizes}
        className="object-cover"
        onError={handleError}
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  );
});

export default UserIcon; 
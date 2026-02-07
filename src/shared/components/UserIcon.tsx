'use client';

/**
 * 4590 표준 적용:
 * - iconUrl은 이미 Storage URL로 변환되어 전달된다고 가정
 * - API-Sports URL 감지/변환 로직 제거 (서버에서 처리)
 */

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { getFallbackIconUrl } from '@/shared/utils/user-icons';
import { getLevelIconUrl } from '@/shared/utils/level-icons';

interface UserIconProps {
  iconUrl?: string | null;
  level?: number;
  exp?: number;
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
  /** 커서 hover 시 표시할 툴팁 텍스트 (미지정 시 레벨/경험치 자동 생성) */
  title?: string;
  /** 자동 툴팁 표시 여부 (title 미지정 시 레벨/경험치로 자동 생성) */
  showLevelTooltip?: boolean;
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
  exp,
  size = 20,
  alt,
  className = '',
  priority = false,
  title,
  showLevelTooltip = true
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

  // 툴팁 텍스트 생성
  const tooltipText = useMemo(() => {
    if (title) return title;
    if (!showLevelTooltip) return undefined;
    // exp가 null 또는 undefined가 아닐 때만 표시
    const expText = exp != null ? ` / ${exp.toLocaleString()} EXP` : '';
    return `Lv.${level}${expText}`;
  }, [title, showLevelTooltip, level, exp]);

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={containerStyle}
      title={tooltipText}
    >
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
    </div>
  );
});

export default UserIcon;

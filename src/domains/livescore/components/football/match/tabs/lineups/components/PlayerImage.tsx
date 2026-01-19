'use client';

import { memo } from 'react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

interface PlayerImageProps {
  alt: string;
  className?: string;
  playerId?: number;
  priority?: boolean;
  width?: string; // "w-8", "w-10" 등 Tailwind 클래스
  height?: string;
  playerName?: string;
  playerNumber?: number;
}

export default memo(function PlayerImage({ 
  alt, 
  className = '', 
  playerId,
  priority = false,
  width = "w-8",
  height = "h-8",
  playerName,
  playerNumber
}: PlayerImageProps) {
  // width 클래스에서 size 추출
  const sizeMap: { [key: string]: 'sm' | 'md' | 'lg' | 'xl' } = {
    'w-6': 'sm',
    'w-8': 'md', 
    'w-10': 'lg',
    'w-12': 'xl'
  };
  
  const size = sizeMap[width] || 'md';
  
  // 폴백 콘텐츠: 선수 번호 또는 이름 첫글자
  const fallbackContent = playerNumber ? (
    <div className="text-xs font-bold text-gray-600 dark:text-gray-400">{playerNumber}</div>
  ) : playerName ? (
    <div className="text-xs font-bold text-gray-600 dark:text-gray-400">{playerName.charAt(0)}</div>
  ) : undefined;

  return playerId && playerId > 0 ? (
    <UnifiedSportsImage
      imageId={playerId}
      imageType={ImageType.Players}
      alt={alt}
      size={size}
      variant="circle"
      priority={priority}
      loading="lazy"
      className={className}
      fallbackContent={fallbackContent}
    />
  ) : (
    <div className={`${width} ${height} bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-full flex items-center justify-center ${className}`}>
      {fallbackContent}
    </div>
  );
}); 
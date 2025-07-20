'use client';

import { memo } from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

interface PlayerImageProps {
  alt: string;
  className?: string;
  playerId?: number;
  priority?: boolean;
  width?: number;
  height?: number;
}

export default memo(function PlayerImage({ 
  alt, 
  className = '', 
  playerId,
  priority = false,
  width = 40,
  height = 40
}: PlayerImageProps) {
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      {playerId && playerId > 0 ? (
        <ApiSportsImage
          imageId={playerId}
          imageType={ImageType.Players}
          alt={alt}
          width={width}
          height={height}
          className="object-cover w-full h-full rounded-full"
          priority={priority}
        />
      ) : (
        // playerId가 없으면 빈 영역 표시
        <div className="w-full h-full bg-gray-200 rounded-full" />
      )}
    </div>
  );
}); 
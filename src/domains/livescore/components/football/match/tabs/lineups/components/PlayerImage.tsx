'use client';

import { memo } from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/utils/image-proxy';

interface PlayerImageProps {
  src?: string;
  alt: string;
  className?: string;
  playerId?: number;
  priority?: boolean;
  width?: number;
  height?: number;
}

export default memo(function PlayerImage({ 
  src, 
  alt, 
  className = '', 
  playerId,
  priority = false,
  width = 40,
  height = 40
}: PlayerImageProps) {
  // playerId가 있으면 API-Sports URL 생성, 없으면 src 사용
  const imageUrl = playerId 
    ? `https://media.api-sports.io/football/players/${playerId}.png`
    : src || '';

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <ApiSportsImage
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        imageId={playerId}
        imageType={ImageType.Players}
        fallbackType={ImageType.Players}
        className="object-cover w-full h-full rounded-full"
        priority={priority}
      />
    </div>
  );
}); 
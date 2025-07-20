'use client';

import { memo } from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { getSupabaseStorageUrl } from '@/shared/utils/image-proxy';

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
  // playerId가 있으면 스토리지 URL 사용, 없으면 기본 이미지
  const imageUrl = playerId 
    ? getSupabaseStorageUrl(ImageType.Players, playerId)
    : src || '';

  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <ApiSportsImage
        src={imageUrl}
        imageId={playerId}
        imageType={ImageType.Players}
        alt={alt}
        width={width}
        height={height}
        className="object-cover w-full h-full rounded-full"
        priority={priority}
        fallbackType={ImageType.Players}
      />
    </div>
  );
}); 
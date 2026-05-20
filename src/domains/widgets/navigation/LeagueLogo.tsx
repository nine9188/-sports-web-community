'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl } from '@/shared/images/urls';

interface LeagueLogoProps {
  src: string;
  alt: string;
  size?: number; // width/height 동시에 관리할 수 있도록 변경
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export default function LeagueLogo({
  src,
  alt,
  size = 56, // 기본값 고정
  className = '',
  fallbackSrc = '/images/placeholder-league.svg',
  priority = false,
}: LeagueLogoProps) {
  const [imgSrc, setImgSrc] = useState(normalizeDisplayImageUrl(src, { fallback: fallbackSrc }));

  useEffect(() => {
    setImgSrc(normalizeDisplayImageUrl(src, { fallback: fallbackSrc }));
  }, [fallbackSrc, src]);

  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={`${size}px`}
        onError={() => setImgSrc(normalizeDisplayImageUrl(fallbackSrc))}
        priority={priority}
        unoptimized={shouldUnoptimizeImageUrl(imgSrc)}
        className="object-contain"
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  fallbackSrc = '/images/fallback-league.png',
  priority = false,
}: LeagueLogoProps) {
  const [imgSrc, setImgSrc] = useState(src);

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
        onError={() => setImgSrc(fallbackSrc)}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}

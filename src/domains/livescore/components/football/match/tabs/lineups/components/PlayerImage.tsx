'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PlayerImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

export default function PlayerImage({ src, alt, className = "" }: PlayerImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
  };

  // 이미지가 없거나 에러가 발생한 경우 폴백 UI 표시
  if (!src || hasError) {
    return (
      <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="기본 이미지">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
      <Image 
        src={src}
        alt={alt}
        width={40}
        height={40}
        className="object-cover rounded-full"
        unoptimized
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
} 
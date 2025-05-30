'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PlayerImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

export default function PlayerImage({ src, alt, className = "" }: PlayerImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // src가 변경될 때마다 상태 초기화
  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);
  }, [src]);

  const handleImageError = () => {
    if (retryCount < 2) {
      // 최대 2번까지 재시도
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
      }, 500);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
        </div>
      )}
      <Image 
        key={`${src}-${retryCount}`}
        src={src}
        alt={alt}
        width={40}
        height={40}
        className={`object-cover rounded-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        unoptimized
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="eager"
      />
    </div>
  );
} 
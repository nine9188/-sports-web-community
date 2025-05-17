'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PlayerImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

export default function PlayerImage({ src, alt, className = "" }: PlayerImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [loading, setLoading] = useState(true);
  
  const handleError = () => {
    setImgSrc(undefined);
    setLoading(false);
  };
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  return (
    <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {imgSrc ? (
        <Image 
          src={imgSrc}
          alt={alt}
          width={40}
          height={40}
          className={`object-cover rounded-full ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          unoptimized
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="기본 이미지">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
} 
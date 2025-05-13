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
    setImgSrc('');
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
      <Image 
        src={imgSrc || ''}
        alt={alt}
        width={40}
        height={40}
        className={`object-cover rounded-full ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        unoptimized
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
} 
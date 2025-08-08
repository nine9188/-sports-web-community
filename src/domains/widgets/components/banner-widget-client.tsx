'use client';

import React, { useState, useEffect } from 'react';
import { Banner } from '../types/banner';
import BannerCarousel from './banner-widget/BannerCarousel';

interface BannerWidgetClientProps {
  banners: Banner[];
}

export default function BannerWidgetClient({ banners }: BannerWidgetClientProps) {
  const [isMobile, setIsMobile] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!isMounted) {
    return (
      <div className="w-full mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {banners.slice(0, 2).map((banner, index) => (
            <div key={`static-${banner.id}`} className="w-full h-52 rounded-lg overflow-hidden relative">
              <img 
                src={banner.image_url} 
                alt={banner.title || `배너 ${index + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {banner.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white font-semibold text-lg">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-white/90 text-sm">{banner.subtitle}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {banners.length === 1 && (
            <div className="w-full h-52 hidden lg:block" />
          )}
        </div>
      </div>
    );
  }
  
  return <BannerCarousel banners={banners} isMobile={isMobile} />;
} 
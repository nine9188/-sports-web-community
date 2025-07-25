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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!isMounted) {
    return <div className="w-full h-52 bg-gray-100 animate-pulse rounded-lg" />;
  }
  
  return <BannerCarousel banners={banners} isMobile={isMobile} />;
} 
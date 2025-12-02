'use client';

import React from 'react';
import BannerCarousel from './banner-widget/BannerCarousel';
import { Banner } from '../types/banner';
import { BANNER_HEIGHT } from './banner-widget/types';

interface BannerWidgetClientProps {
  banners: Banner[];
}

export default function BannerWidgetClient({ banners }: BannerWidgetClientProps) {
  return (
    <div className="relative w-full" style={{ minHeight: BANNER_HEIGHT, overflow: 'visible' }}>
      <BannerCarousel banners={banners} />
    </div>
  );
}
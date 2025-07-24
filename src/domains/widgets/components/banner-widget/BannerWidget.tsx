'use client';

import React, { useState, useEffect } from 'react';
import { BannerWidgetProps, MOBILE_BREAKPOINT } from './types';
import MobileBannerWidget from './MobileBannerWidget';
import DesktopBannerWidget from './DesktopBannerWidget';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

export default function BannerWidget({ banners }: BannerWidgetProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // SSR 기본값 모바일

  // 화면 크기 체크 함수
  const checkMobileState = () => {
    const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(newIsMobile);
  };

  // 마운트 및 리사이즈 이벤트 처리
  useEffect(() => {
    setIsMounted(true);
    checkMobileState();
    
    window.addEventListener('resize', checkMobileState);
    return () => window.removeEventListener('resize', checkMobileState);
  }, []);

  // 빈 배너 처리
  if (!banners?.length) {
    return null;
  }

  // SSR 대응 - 하이드레이션 불일치 방지
  if (!isMounted) {
    return (
      <div className="w-full">
        <div className="relative">
          <div className="flex w-full">
            <BannerWrapper banner={banners[0]} index={0}>
              {renderBannerContent(banners[0])}
            </BannerWrapper>
          </div>
        </div>
      </div>
    );
  }

  // 마운트 후 디바이스에 따라 적절한 컴포넌트 렌더링
  return isMobile ? (
    <MobileBannerWidget banners={banners} />
  ) : (
    <DesktopBannerWidget banners={banners} />
  );
} 
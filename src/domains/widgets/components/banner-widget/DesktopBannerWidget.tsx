'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  BannerWidgetProps, 
  BannerConfig, 
  SlideButtonProps, 
  IndicatorsProps,
  DEFAULT_AUTO_SLIDE_INTERVAL 
} from './types';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

// 슬라이드 버튼 컴포넌트
function SlideButton({ direction, onClick }: SlideButtonProps) {
  const isNext = direction === 'next';
  const positionClass = isNext ? 'right-[-12px]' : 'left-[-12px]';
  const ariaLabel = isNext ? '다음 배너' : '이전 배너';
  const iconPath = isNext 
    ? "m8.25 4.5 7.5 7.5-7.5 7.5" 
    : "M15.75 19.5 8.25 12l7.5-7.5";

  return (
    <button 
      onClick={onClick}
      className={`absolute ${positionClass} top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-lg border transition-all duration-200 bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:scale-110 hover:shadow-xl cursor-pointer group`}
      aria-label={ariaLabel}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className="w-5 h-5 transition-colors text-gray-600 group-hover:text-blue-600"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    </button>
  );
}

// 인디케이터 컴포넌트
function Indicators({ banners, currentIndex, onSlideChange }: IndicatorsProps) {
  return (
    <div className="flex justify-center mt-3">
      <div className="flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index
                ? 'bg-blue-600 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => onSlideChange(index)}
            aria-label={`배너 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
}

export default function DesktopBannerWidget({ banners }: BannerWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 배너 설정 계산
  const bannerConfig = useMemo((): BannerConfig => {
    const firstBanner = banners[0];
    if (!firstBanner) {
      return {
        itemsPerView: 2,
        autoSlideInterval: DEFAULT_AUTO_SLIDE_INTERVAL,
        displayType: 'slide'
      };
    }

    return {
      itemsPerView: firstBanner.desktop_per_row,
      autoSlideInterval: firstBanner.auto_slide_interval || DEFAULT_AUTO_SLIDE_INTERVAL,
      displayType: firstBanner.display_type
    };
  }, [banners]);

  // 표시할 배너 목록 계산
  const displayBanners = useMemo(() => {
    const result = [];
    for (let i = 0; i < bannerConfig.itemsPerView; i++) {
      const index = (currentIndex + i) % banners.length;
      result.push(banners[index]);
    }
    return result;
  }, [banners, currentIndex, bannerConfig.itemsPerView]);

  // 슬라이드 제어 조건
  const shouldShowSlideControls = useMemo(() => 
    bannerConfig.displayType === 'slide' && banners.length > bannerConfig.itemsPerView,
    [bannerConfig.displayType, banners.length, bannerConfig.itemsPerView]
  );

  // 자동 재생 재개 함수
  const resumeAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, []);

  // 슬라이드 네비게이션 함수
  const navigateSlide = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % banners.length;
      }
      return (prevIndex - 1 + banners.length) % banners.length;
    });
    resumeAutoPlay();
  }, [banners.length, resumeAutoPlay]);

  // 인덱스로 직접 이동
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    resumeAutoPlay();
  }, [resumeAutoPlay]);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (!isAutoPlaying || !shouldShowSlideControls) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
    }, bannerConfig.autoSlideInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, shouldShowSlideControls, banners.length, bannerConfig.autoSlideInterval]);

  // 빈 배너 처리
  if (!banners?.length) {
    return null;
  }

  return (
    <div className="w-full mb-4 md:mt-0">
      <div className="relative">
        {/* 데스크탑 슬라이딩 버튼 */}
        {shouldShowSlideControls && (
          <>
            <SlideButton direction="prev" onClick={() => navigateSlide('prev')} />
            <SlideButton direction="next" onClick={() => navigateSlide('next')} />
          </>
        )}
        
        {/* 배너 컨테이너 */}
        <div className="flex gap-3 w-full transition-all duration-300 ease-in-out">
          {displayBanners.map((banner, index) => (
            <BannerWrapper key={`${banner.id}-${index}`} banner={banner} index={index}>
              {renderBannerContent(banner)}
            </BannerWrapper>
          ))}
        </div>
        
        {/* 인디케이터 */}
        {bannerConfig.displayType === 'slide' && banners.length > 1 && (
          <Indicators 
            banners={banners}
            currentIndex={currentIndex}
            onSlideChange={goToSlide}
          />
        )}
      </div>
    </div>
  );
} 
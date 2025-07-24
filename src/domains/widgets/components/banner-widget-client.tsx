'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner } from '../types/banner';

interface BannerWidgetClientProps {
  banners: Banner[];
}

// 상수 정의
const MOBILE_BREAKPOINT = 768;
const DEFAULT_AUTO_SLIDE_INTERVAL = 10000;
const AUTO_PLAY_RESUME_DELAY = 3000;
const SWIPE_THRESHOLD = 50;
const BANNER_HEIGHT = '210px';

// 타입 정의
interface TouchState {
  start: number | null;
  end: number | null;
}

interface BannerConfig {
  itemsPerView: number;
  autoSlideInterval: number;
  displayType: Banner['display_type'];
}

export default function BannerWidgetClient({ banners }: BannerWidgetClientProps) {
  // 상태 관리
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchState, setTouchState] = useState<TouchState>({ start: null, end: null });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // SSR 기본값 모바일
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 배너 설정 계산
  const bannerConfig = useMemo((): BannerConfig => {
    const firstBanner = banners[0];
    if (!firstBanner) {
      return {
        itemsPerView: 1,
        autoSlideInterval: DEFAULT_AUTO_SLIDE_INTERVAL,
        displayType: 'slide'
      };
    }

    return {
      itemsPerView: isMobile ? firstBanner.mobile_per_row : firstBanner.desktop_per_row,
      autoSlideInterval: firstBanner.auto_slide_interval || DEFAULT_AUTO_SLIDE_INTERVAL,
      displayType: firstBanner.display_type
    };
  }, [banners, isMobile]);

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
    setTimeout(() => setIsAutoPlaying(true), AUTO_PLAY_RESUME_DELAY);
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

  // 화면 크기 체크 함수
  const checkMobileState = useCallback(() => {
    const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(newIsMobile);
    
    // 화면 크기 변경 시 인덱스 보정
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, banners.length]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchState({ start: e.targetTouches[0].clientX, end: null });
    setIsAutoPlaying(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchState(prev => ({ ...prev, end: e.targetTouches[0].clientX }));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.start || !touchState.end) return;
    
    const distance = touchState.start - touchState.end;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;
    const isRightSwipe = distance < -SWIPE_THRESHOLD;

    if (isLeftSwipe) {
      navigateSlide('next');
    } else if (isRightSwipe) {
      navigateSlide('prev');
    } else {
      // 스와이프가 감지되지 않으면 자동 재생 재개
      setTimeout(() => setIsAutoPlaying(true), AUTO_PLAY_RESUME_DELAY);
    }
  }, [touchState, navigateSlide]);

  // 마운트 및 리사이즈 이벤트 처리
  useEffect(() => {
    setIsMounted(true);
    checkMobileState();
    
    window.addEventListener('resize', checkMobileState);
    return () => window.removeEventListener('resize', checkMobileState);
  }, [checkMobileState]);

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

  // 배너 렌더링 함수들
  const renderImageBanner = useCallback((banner: Banner) => (
    <>
      {banner.image_url ? (
        <div className="absolute inset-0">
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover rounded-lg"
            onError={(e) => {
              console.error('❌ 배너 이미지 로드 실패:', banner.image_url);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
            unoptimized
          />
        </div>
      ) : (
        <div 
          className="h-full flex flex-col justify-center items-center text-center p-4 rounded-lg"
          style={{ backgroundColor: banner.background_color, color: banner.text_color }}
        >
          <div className="text-lg font-bold">{banner.title}</div>
          {banner.subtitle && (
            <div className="text-sm opacity-75">{banner.subtitle}</div>
          )}
        </div>
      )}
    </>
  ), []);

  const renderHtmlBanner = useCallback((banner: Banner) => (
    <div 
      className="h-full w-full"
      dangerouslySetInnerHTML={{ __html: banner.html_content || '' }}
    />
  ), []);

  const renderBannerContent = useCallback((banner: Banner) => {
    switch (banner.type) {
      case 'image':
        return renderImageBanner(banner);
      case 'html':
        return renderHtmlBanner(banner);
      default:
        return renderImageBanner(banner);
    }
  }, [renderImageBanner, renderHtmlBanner]);

  // 배너 래퍼 컴포넌트
  const BannerWrapper = useCallback(({ banner, children, index }: { 
    banner: Banner; 
    children: React.ReactNode; 
    index: number;
  }) => {
    const isExternalLink = banner.link_url && (
      banner.link_url.startsWith('http://') || 
      banner.link_url.startsWith('https://') ||
      banner.link_url.startsWith('//')
    );
    
    const commonProps = {
      className: `flex-1 min-w-0 border rounded-lg transition-all shadow-sm group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation active:scale-[0.99] transform-gpu select-none relative overflow-hidden ${
        banner.link_url ? 'cursor-pointer' : ''
      } border-gray-200`,
      style: {
        height: BANNER_HEIGHT,
        backgroundColor: banner.background_color || '#ffffff',
        color: banner.text_color || '#000000',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        WebkitTouchCallout: 'none' as const,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation' as const
      },
      onDragStart: (e: React.DragEvent) => e.preventDefault()
    };
    
    const uniqueKey = `${banner.id}-${index}`;
    
    if (!banner.link_url) {
      return (
        <div key={uniqueKey} {...commonProps}>
          {children}
        </div>
      );
    }
    
    if (isExternalLink) {
      return (
        <a
          key={uniqueKey}
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          {...commonProps}
        >
          {children}
        </a>
      );
    }
    
    return (
      <Link key={uniqueKey} href={banner.link_url} {...commonProps}>
        {children}
      </Link>
    );
  }, []);

  // 슬라이드 버튼 컴포넌트
  const SlideButton = useCallback(({ direction, onClick }: {
    direction: 'prev' | 'next';
    onClick: () => void;
  }) => {
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
  }, []);

  // 인디케이터 컴포넌트
  const Indicators = useCallback(() => (
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
            onClick={() => goToSlide(index)}
            aria-label={`배너 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  ), [banners, currentIndex, goToSlide]);

  // 빈 배너 처리
  if (!banners?.length) {
    return null;
  }

  // SSR 대응 - 하이드레이션 불일치 방지
  if (!isMounted) {
    return (
      <div className="w-full mb-4 mt-4 md:mt-0">
        <div className="relative">
          <div className="flex gap-3 w-full">
            <BannerWrapper banner={banners[0]} index={0}>
              {renderBannerContent(banners[0])}
            </BannerWrapper>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      <div className="relative">
        {/* 데스크탑 슬라이딩 버튼 */}
        {shouldShowSlideControls && (
          <div className="hidden md:block">
            <SlideButton direction="prev" onClick={() => navigateSlide('prev')} />
            <SlideButton direction="next" onClick={() => navigateSlide('next')} />
          </div>
        )}
        
        {/* 배너 컨테이너 */}
        <div 
          className="flex gap-3 w-full transition-all duration-300 ease-in-out select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y pinch-zoom'
          }}
        >
          {displayBanners.map((banner, index) => (
            <BannerWrapper key={`${banner.id}-${index}`} banner={banner} index={index}>
              {renderBannerContent(banner)}
            </BannerWrapper>
          ))}
        </div>
        
        {/* 인디케이터 */}
        {bannerConfig.displayType === 'slide' && banners.length > 1 && (
          <Indicators />
        )}
      </div>
    </div>
  );
} 
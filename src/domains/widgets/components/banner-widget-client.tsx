'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner } from '../types/banner';

interface BannerWidgetClientProps {
  banners: Banner[];
}

export default function BannerWidgetClient({ banners }: BannerWidgetClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 서버사이드 기본값을 모바일로 설정하여 깜빡임 방지
  const [isMobile, setIsMobile] = useState(true);
  
  // 첫 번째 배너의 설정을 기본값으로 사용
  const firstBanner = banners[0] || {
    mobile_per_row: 1,
    desktop_per_row: 2,
    auto_slide_interval: 10000,
    display_type: 'slide' as const
  };
  
  const itemsPerView = isMobile ? firstBanner.mobile_per_row : firstBanner.desktop_per_row;
  const autoSlideInterval = firstBanner.auto_slide_interval || 10000;
  const maxIndex = banners.length - 1;

  // 이미지 배너 렌더링
  const renderImageBanner = (banner: Banner) => (
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
        <div className="h-full flex flex-col justify-center items-center text-center p-4 rounded-lg"
             style={{ backgroundColor: banner.background_color, color: banner.text_color }}>
          <div className="text-lg font-bold">{banner.title}</div>
          {banner.subtitle && (
            <div className="text-sm opacity-75">{banner.subtitle}</div>
          )}
        </div>
      )}
    </>
  );

  // HTML 배너 렌더링
  const renderHtmlBanner = (banner: Banner) => (
    <div 
      className="h-full w-full"
      dangerouslySetInnerHTML={{ __html: banner.html_content || '' }}
    />
  );

  // 배너 타입에 따른 렌더링
  const renderBannerContent = (banner: Banner) => {
    switch (banner.type) {
      case 'image':
        return renderImageBanner(banner);
      case 'html':
        return renderHtmlBanner(banner);
      default:
        return renderImageBanner(banner);
    }
  };

  // 마운트 감지 및 모바일 체크
  useEffect(() => {
    setIsMounted(true);
    
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // 화면 크기 변경 시 인덱스 보정
      if (currentIndex > maxIndex) {
        setCurrentIndex(0);
      }
    };
    
    // 초기 체크
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [currentIndex, maxIndex]);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (isAutoPlaying && banners.length > itemsPerView && firstBanner.display_type === 'slide') {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => 
          (prevIndex + 1) % banners.length
        );
      }, autoSlideInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, maxIndex, itemsPerView, autoSlideInterval, banners.length, firstBanner.display_type]);

  // 배너가 없으면 렌더링하지 않음
  if (!banners || banners.length === 0) {
    return null;
  }

  // 하이드레이션 불일치 방지 - 클라이언트에서 마운트되기 전까지는 모바일 기준으로 렌더링
  if (!isMounted) {
    return (
      <div className="w-full mb-4 mt-4 md:mt-0">
        <div className="relative">
          <div 
            className="flex gap-3 w-full transition-all duration-300 ease-in-out select-none"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'pan-y pinch-zoom'
            }}
          >
            {/* 모바일 기준 1개 배너만 표시 */}
            {banners.slice(0, 1).map((banner) => {
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
                  height: '210px',
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
              
              if (banner.link_url) {
                if (isExternalLink) {
                  return (
                    <a
                      key={banner.id}
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...commonProps}
                    >
                      {renderBannerContent(banner)}
                    </a>
                  );
                } else {
                  return (
                    <Link
                      key={banner.id}
                      href={banner.link_url}
                      {...commonProps}
                    >
                      {renderBannerContent(banner)}
                    </Link>
                  );
                }
              } else {
                return (
                  <div 
                    key={banner.id}
                    {...commonProps}
                  >
                    {renderBannerContent(banner)}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    );
  }

  // 부드러운 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    
    // 드래그 거리를 컨테이너 너비의 비율로 계산
    const dragRatio = diff / containerWidth;
    setDragOffset(dragRatio * 100); // 백분율로 변환
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const threshold = containerWidth * 0.2; // 20% 이상 드래그 시 슬라이드
    
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe) {
      setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
    } else if (isRightSwipe) {
      setCurrentIndex(prevIndex => (prevIndex - 1 + banners.length) % banners.length);
    }

    setIsDragging(false);
    setDragOffset(0);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // 슬라이드 버튼 핸들러
  const slideLeft = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const slideRight = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      <div className="relative overflow-hidden">
        {/* 데스크탑 슬라이딩 버튼 */}
        {firstBanner.display_type === 'slide' && (
          <div className="hidden md:block">
            {banners.length > itemsPerView && (
              <>
                {/* 왼쪽 버튼 */}
                <button 
                  onClick={slideLeft}
                  className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-lg border transition-all duration-200 bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:scale-110 hover:shadow-xl cursor-pointer group"
                  aria-label="이전 배너"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-colors text-gray-600 group-hover:text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                
                {/* 오른쪽 버튼 */}
                <button 
                  onClick={slideRight}
                  className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-lg border transition-all duration-200 bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:scale-110 hover:shadow-xl cursor-pointer group"
                  aria-label="다음 배너"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-colors text-gray-600 group-hover:text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="flex w-full select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y pinch-zoom',
            transform: isDragging ? `translateX(-${dragOffset}%)` : `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            width: `${banners.length * (100 / itemsPerView)}%`
          }}
        >
          {/* 모든 배너를 렌더링하고 CSS transform으로 슬라이드 */}
          {banners.map((banner, index) => {
            const uniqueKey = `${banner.id}-${index}`;
            
            // 내부/외부 링크 구분
            const isExternalLink = banner.link_url && (
              banner.link_url.startsWith('http://') || 
              banner.link_url.startsWith('https://') ||
              banner.link_url.startsWith('//')
            );
            
            const commonProps = {
              className: `border rounded-lg transition-all shadow-sm group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation active:scale-[0.99] transform-gpu select-none relative overflow-hidden mx-1.5 ${
                banner.link_url ? 'cursor-pointer' : ''
              } border-gray-200`,
              style: {
                width: `${100 / banners.length}%`,
                height: '210px',
                backgroundColor: banner.background_color || '#ffffff',
                color: banner.text_color || '#000000',
                userSelect: 'none' as const,
                WebkitUserSelect: 'none' as const,
                WebkitTouchCallout: 'none' as const,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation' as const,
                flexShrink: 0
              },
              onDragStart: (e: React.DragEvent) => e.preventDefault()
            };
            
            // 링크가 있는 경우 처리
            if (banner.link_url) {
              if (isExternalLink) {
                // 외부 링크 - 새 탭에서 열기
                return (
                  <a
                    key={uniqueKey}
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...commonProps}
                  >
                    {renderBannerContent(banner)}
                  </a>
                );
              } else {
                // 내부 링크 - Next.js Link 사용
                return (
                  <Link
                    key={uniqueKey}
                    href={banner.link_url}
                    {...commonProps}
                  >
                    {renderBannerContent(banner)}
                  </Link>
                );
              }
            } else {
              // 링크가 없는 경우
              return (
                <div 
                  key={uniqueKey}
                  {...commonProps}
                >
                  {renderBannerContent(banner)}
                </div>
              );
            }
          })}
        </div>
        
        {/* 인디케이터 */}
        {firstBanner.display_type === 'slide' && banners.length > 1 && (
          <div className="flex justify-center mt-3">
            <div className="flex space-x-2">
              {Array.from({ length: banners.length }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoPlaying(false);
                    setTimeout(() => setIsAutoPlaying(true), 3000);
                  }}
                  aria-label={`배너 ${index + 1}로 이동`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
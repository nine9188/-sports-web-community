'use client';

import React, { useState, useCallback } from 'react';
import { BannerWidgetProps, TouchState, SWIPE_THRESHOLD } from './types';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

export default function MobileBannerWidget({ banners }: BannerWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchState, setTouchState] = useState<TouchState>({ start: null, end: null });

  // 슬라이드 네비게이션 함수
  const navigateSlide = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % banners.length;
      }
      return (prevIndex - 1 + banners.length) % banners.length;
    });
  }, [banners.length]);

  // 인덱스로 직접 이동
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchState({ start: e.targetTouches[0].clientX, end: null });
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
    }
  }, [touchState, navigateSlide]);

  // 빈 배너 처리
  if (!banners?.length) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="w-full mb-4 mt-4">
      {/* 모바일 배너 컨테이너 */}
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
        <BannerWrapper banner={currentBanner} index={currentIndex}>
          {renderBannerContent(currentBanner)}
        </BannerWrapper>
      </div>
      
      {/* 모바일 인디케이터 */}
      {banners.length > 1 && (
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
      )}
    </div>
  );
} 
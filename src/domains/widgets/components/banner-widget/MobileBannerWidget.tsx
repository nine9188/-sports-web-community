'use client';

import React, { useState, useCallback, useRef } from 'react';
import { BannerWidgetProps, TouchState, SWIPE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD } from './types';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

export default function MobileBannerWidget({ banners }: BannerWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchState, setTouchState] = useState<TouchState>({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 슬라이드 네비게이션 함수
  const navigateSlide = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prevIndex => {
      if (direction === 'next') {
        return (prevIndex + 1) % banners.length;
      }
      return (prevIndex - 1 + banners.length) % banners.length;
    });
    setDragOffset(0);
  }, [banners.length]);

  // 인덱스로 직접 이동
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setDragOffset(0);
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchState({ start: e.targetTouches[0].clientX, end: null });
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.start) return;
    
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchState.start;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    
    // 드래그 거리를 컨테이너 너비 기준으로 정규화 (-1 ~ 1)
    let normalizedOffset = diff / containerWidth;
    
    // 드래그 제한: 엘라스틱 효과 적용 (최대 ±0.5로 제한)
    const maxDrag = 0.5;
    if (Math.abs(normalizedOffset) > maxDrag) {
      const sign = normalizedOffset > 0 ? 1 : -1;
      // 엘라스틱 곡선: 제한값을 넘으면 저항이 증가
      const excess = Math.abs(normalizedOffset) - maxDrag;
      normalizedOffset = sign * (maxDrag + excess * 0.3);
    }
    
    setTouchState(prev => ({ ...prev, end: currentX }));
    setDragOffset(normalizedOffset);
  }, [touchState.start]);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.start || !touchState.end) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchState.start - touchState.end;
    const absDragOffset = Math.abs(dragOffset);
    
    // 픽셀 거리와 드래그 비율 모두 고려
    const isLeftSwipe = distance > SWIPE_THRESHOLD || (distance > 0 && absDragOffset > SWIPE_VELOCITY_THRESHOLD);
    const isRightSwipe = distance < -SWIPE_THRESHOLD || (distance < 0 && absDragOffset > SWIPE_VELOCITY_THRESHOLD);

    if (isLeftSwipe) {
      navigateSlide('next');
    } else if (isRightSwipe) {
      navigateSlide('prev');
    } else {
      // 임계값에 도달하지 않으면 원래 위치로 복귀
      setDragOffset(0);
    }
    
    setIsDragging(false);
  }, [touchState, dragOffset, navigateSlide]);

  // 빈 배너 처리
  if (!banners?.length) {
    return null;
  }

  // 연속 슬라이드를 위한 배너 배열 (이전, 현재, 다음)
  const getPrevIndex = (index: number) => (index - 1 + banners.length) % banners.length;
  const getNextIndex = (index: number) => (index + 1) % banners.length;

  const prevBanner = banners[getPrevIndex(currentIndex)];
  const currentBanner = banners[currentIndex];
  const nextBanner = banners[getNextIndex(currentIndex)];

  // Transform 계산
  const baseTransform = -100; // 현재 배너가 중앙에 오도록
  const dragTransform = dragOffset * 100; // 드래그 오프셋
  const totalTransform = baseTransform + dragTransform;

  return (
    <div className="w-full">
      {/* 모바일 배너 컨테이너 */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-x',
          overscrollBehavior: 'contain'
        }}
      >
        <div 
          className={`flex w-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{
            transform: `translateX(${totalTransform}%)`,
            width: '300%' // 3개 배너를 나란히 배치
          }}
        >
          {/* 이전 배너 */}
          <div className="w-1/3 flex-shrink-0">
            <BannerWrapper banner={prevBanner} index={getPrevIndex(currentIndex)}>
              {renderBannerContent(prevBanner)}
            </BannerWrapper>
          </div>
          
          {/* 현재 배너 */}
          <div className="w-1/3 flex-shrink-0">
            <BannerWrapper banner={currentBanner} index={currentIndex}>
              {renderBannerContent(currentBanner)}
            </BannerWrapper>
          </div>
          
          {/* 다음 배너 */}
          <div className="w-1/3 flex-shrink-0">
            <BannerWrapper banner={nextBanner} index={getNextIndex(currentIndex)}>
              {renderBannerContent(nextBanner)}
            </BannerWrapper>
          </div>
        </div>
      </div>
      
      {/* 모바일 인디케이터 */}
      {banners.length > 1 && (
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
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
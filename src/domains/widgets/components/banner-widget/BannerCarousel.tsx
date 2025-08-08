'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { BannerWidgetProps, BANNER_HEIGHT } from './types';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

type BannerCarouselProps = BannerWidgetProps;

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  // 가장자리에 딱 맞추고 루프 이음매 간격 유지
  const [viewportRef, emblaApi] = useEmblaCarousel({ loop: banners.length > 1, align: 'start', containScroll: 'trimSnaps' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  if (!banners?.length) return null;

  return (
    <div className="relative z-20 w-full" style={{ overflow: 'visible' }}>
      <div className="relative overflow-hidden py-0 lg:py-1">
        <div className="embla" ref={viewportRef}>
          <div className="embla__container flex -mx-0 lg:-mx-1">
            {banners.map((banner, index) => (
              <div key={`${banner.id}-${index}`} className={`embla__slide shrink-0 basis-full lg:basis-1/2 px-0 lg:px-1`}>
                <div className="relative w-full" style={{ height: BANNER_HEIGHT, overflow: 'visible' }}>
                  <BannerWrapper banner={banner} index={index}>
                    {renderBannerContent(banner)}
                  </BannerWrapper>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 데스크탑 네비게이션 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hidden lg:flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
            aria-label="이전 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hidden lg:flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
            aria-label="다음 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* 모바일 페이징 점 */}
      {scrollSnaps.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center lg:hidden">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`mx-1 h-2 w-2 rounded-full transition-all ${selectedIndex === i ? 'bg-blue-500 scale-110' : 'bg-black/30'}`}
              aria-label={`배너 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
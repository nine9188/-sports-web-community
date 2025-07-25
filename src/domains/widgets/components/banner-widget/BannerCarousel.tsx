'use client';

import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Swiper 스타일
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

import { BannerWidgetProps, BANNER_HEIGHT } from './types';
import BannerWrapper, { renderBannerContent } from './BannerWrapper';

interface BannerCarouselProps extends BannerWidgetProps {
  isMobile?: boolean;
}

export default function BannerCarousel({ banners, isMobile = false }: BannerCarouselProps) {
  const swiperRef = useRef<SwiperType>();

  if (!banners?.length) {
    return null;
  }

  // 모바일과 데스크탑 설정
  const swiperConfig = {
    modules: [Navigation, Pagination, Autoplay, EffectFade],
    spaceBetween: 12,
    slidesPerView: isMobile ? 1 : (banners.length >= 2 ? 2 : 1),
    centeredSlides: false,
    loop: !isMobile && banners.length > 1,
    
    // 자동 재생 설정
    autoplay: banners.length > 1 ? {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    } : false,

    // 네비게이션 설정 (데스크탑만)
    navigation: !isMobile && banners.length > 1 ? {
      nextEl: '.swiper-button-next-custom',
      prevEl: '.swiper-button-prev-custom',
    } : false,

    // 페이지네이션 설정
    pagination: banners.length > 1 ? {
      el: '.swiper-pagination-custom',
      clickable: true,
      bulletActiveClass: 'swiper-pagination-bullet-active-custom',
      bulletClass: 'swiper-pagination-bullet-custom',
      dynamicBullets: false,
      renderBullet: function (index: number, className: string) {
        return '<span class="' + className + '"></span>';
      },
    } : false,

    // 터치 설정
    touchRatio: isMobile ? 1 : 0.5,
    threshold: 10,
    
    // 속도 설정
    speed: 300,

    // 반응형 설정
    ...(isMobile ? {} : {
      breakpoints: {
        768: {
          slidesPerView: 1,
          spaceBetween: 8,
        },
        1024: {
          slidesPerView: banners.length >= 2 ? 2 : 1,
          spaceBetween: 8,
        },
      },
    }),

    onBeforeInit: (swiper: SwiperType) => {
      swiperRef.current = swiper;
    },
  };

  return (
    <div className={`relative w-full ${isMobile ? 'mt-4' : ''}`}>
      {/* 메인 Swiper */}
      <Swiper
        {...swiperConfig}
        className={`banner-carousel ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {banners.map((banner, index) => (
          <SwiperSlide 
            key={`${banner.id}-${index}`}
            className={isMobile ? '' : 'banner-slide-desktop'}
          >
            <div 
              className="relative w-full overflow-hidden"
              style={{ height: BANNER_HEIGHT }}
            >
              <BannerWrapper banner={banner} index={index}>
                {renderBannerContent(banner)}
              </BannerWrapper>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 네비게이션 버튼 (데스크탑만) */}
      {!isMobile && banners.length > 1 && (
        <>
                     <button 
             className="swiper-button-prev-custom absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
             aria-label="이전 배너"
           >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-5 h-5 text-gray-600 group-hover:text-blue-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          
                     <button 
             className="swiper-button-next-custom absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
             aria-label="다음 배너"
           >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-5 h-5 text-gray-600 group-hover:text-blue-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* 커스텀 페이지네이션 */}
      {banners.length > 1 && (
        <div className={`swiper-pagination-custom flex justify-center ${isMobile ? 'mt-4' : 'mt-3'}`}>
          {/* Swiper가 자동으로 bullet을 생성합니다 */}
        </div>
      )}

             <style jsx>{`
         .banner-carousel {
           padding: 0 4px;
         }

                                   .banner-slide-desktop {
            width: calc(50% - 4px) !important;
          }

        .swiper-pagination-bullet-custom {
          width: 8px;
          height: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          margin: 0 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 1;
        }

        .swiper-pagination-bullet-active-custom {
          background: #3b82f6;
          transform: scale(1.2);
        }

        .swiper-pagination-bullet-custom:hover {
          background: #3b82f6;
          transform: scale(1.1);
        }

                 /* 모바일에서 스와이프 영역 확장 */
         .mobile.banner-carousel {
           margin: 0 -4px;
           padding: 0 4px;
         }

         .mobile .swiper-slide {
           padding: 0 4px;
         }

                   /* 데스크탑에서 슬라이드 간격 조정 */
          .desktop.banner-carousel .swiper-slide {
            margin-right: 8px;
          }

          .desktop.banner-carousel .swiper-slide:last-child {
            margin-right: 0;
          }
      `}</style>
    </div>
  );
} 
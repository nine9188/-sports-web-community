'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// 배너 데이터 타입
interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  backgroundColor: string;
  link?: string;
}

// 샘플 배너 데이터 - 기존 프로젝트 색상에 맞춰 조정
const bannerData: BannerItem[] = [
  {
    id: '1',
    title: '리버풀 프리미어리그 우승',
    subtitle: '챔피언스의 영광스러운 순간',
    image: '/213/리버풀 프리미어리그 우승.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  },
  {
    id: '2',
    title: '팀 순위 & 통계',
    subtitle: '최신 리그 순위와 선수 통계',
    image: '/213/리버풀 프리미어리그 우승1.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  },
  {
    id: '3',
    title: '경기 예측',
    subtitle: '다가오는 경기를 예측해보세요',
    image: '/213/리버풀 프리미어리그 우승2.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  },
  {
    id: '4',
    title: '축구 뉴스',
    subtitle: '최신 축구 소식과 이슈',
    image: '/213/리버풀 프리미어리그 우승3.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  },
  {
    id: '5',
    title: '포인트 상점',
    subtitle: '포인트로 다양한 아이템 구매',
    image: '/213/리버풀 프리미어리그 우승4.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  },
  {
    id: '6',
    title: '설정',
    subtitle: '프로필 및 계정 설정',
    image: '/213/리버풀 프리미어리그 우승5.png',
    backgroundColor: 'bg-red-50 hover:bg-red-100',
    link: '/livescore/football'
  }
];

export default function BannerWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 반응형 아이템 수 (모바일: 1개, 데스크탑: 2개)
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerView = isMobile ? 1 : 2;
  // 무한 루프를 위해 전체 배너 개수를 maxIndex로 설정
  const maxIndex = bannerData.length - 1;

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
             // 화면 크기 변경 시 인덱스 보정
       const newMaxIndex = bannerData.length - 1;
       if (currentIndex > newMaxIndex) {
         setCurrentIndex(0);
       }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [currentIndex]);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (isAutoPlaying && bannerData.length > itemsPerView) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => 
          prevIndex >= maxIndex ? 0 : prevIndex + 1
        );
      }, 5000); // 5초마다 자동 슬라이드
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, maxIndex, itemsPerView]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // 오른쪽으로 스와이프 (다음)
      setCurrentIndex(prevIndex => prevIndex < maxIndex ? prevIndex + 1 : 0);
    }
    if (isRightSwipe) {
      // 왼쪽으로 스와이프 (이전)
      setCurrentIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : maxIndex);
    }

    // 터치 후 3초 뒤 자동 재생 재개
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // 슬라이드 버튼 핸들러 - 무한 루프
  const slideLeft = () => {
    setCurrentIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : maxIndex);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const slideRight = () => {
    setCurrentIndex(prevIndex => prevIndex < maxIndex ? prevIndex + 1 : 0);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      {/* 배너 컨테이너 - 라이브스코어 위젯과 동일한 스타일 적용 */}
      <div className="relative">
        {/* 데스크탑 슬라이딩 버튼 */}
        <div className="hidden md:block">
          {bannerData.length > itemsPerView && (
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
        
        {/* 배너 카드 컨테이너 */}
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
          {/* 현재 보여줄 배너들 */}
          {Array.from({ length: itemsPerView }, (_, i) => {
            const bannerIndex = (currentIndex + i) % bannerData.length;
            return bannerData[bannerIndex];
          }).map((banner) => (
            <Link
              key={banner.id}
              href={banner.link || '#'}
              className={`flex-1 min-w-0 border rounded-lg transition-all shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation active:scale-[0.99] bg-white border-gray-200 transform-gpu select-none relative overflow-hidden ${banner.backgroundColor}`}
              style={{
                height: '210px', // 라이브스코어 위젯(140px)보다 1.5배
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              onDragStart={(e) => e.preventDefault()}
            >
              {/* 배경 이미지 또는 아이콘 */}
              {banner.image ? (
                <div className="absolute inset-0">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-fill"
                    onLoad={() => {
                      console.log('✅ 배너 이미지 로드 성공:', banner.image);
                    }}
                    onError={(e) => {
                      console.error('❌ 배너 이미지 로드 실패:', banner.image);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    unoptimized
                  />
                </div>
              ) : (
                /* 아이콘 기반 배너 (기존 스타일) */
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  {banner.icon && (
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {banner.icon}
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {banner.title}
                  </h3>
                  
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}

        </div>
        
        {/* 인디케이터 */}
        {bannerData.length > itemsPerView && (
          <div className="flex justify-center mt-3">
            <div className="flex space-x-2">
              {Array.from({ length: bannerData.length }).map((_, index) => (
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
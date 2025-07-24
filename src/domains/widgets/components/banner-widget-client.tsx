'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Banner } from '../types/banner';

interface BannerWidgetClientProps {
  banners: Banner[];
}

export default function BannerWidgetClient({ banners }: BannerWidgetClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  
  // 첫 번째 배너의 설정을 기본값으로 사용
  const firstBanner = banners[0] || {
    mobile_per_row: 1,
    desktop_per_row: 2,
    auto_slide_interval: 10000,
    display_type: 'slide' as const
  };
  
  const itemsPerView = isMobile ? firstBanner.mobile_per_row : firstBanner.desktop_per_row;

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
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 배너가 없으면 렌더링하지 않음
  if (!banners || banners.length === 0) {
    return null;
  }

  // 하이드레이션 불일치 방지
  if (!isMounted) {
    return (
      <div className="w-full mb-4 mt-4 md:mt-0">
        <div className="flex gap-3 w-full">
          {banners.slice(0, 1).map((banner) => (
            <div 
              key={banner.id}
              className="flex-1 min-w-0 border rounded-lg transition-all shadow-sm hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 relative overflow-hidden border-gray-200"
              style={{
                height: '210px',
                backgroundColor: banner.background_color || '#ffffff',
                color: banner.text_color || '#000000'
              }}
            >
              {renderBannerContent(banner)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 현재 보여줄 배너들
  const displayBanners = banners.slice(0, itemsPerView);

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      <div className="flex gap-3 w-full">
        {displayBanners.map((banner) => {
          // 내부/외부 링크 구분
          const isExternalLink = banner.link_url && (
            banner.link_url.startsWith('http://') || 
            banner.link_url.startsWith('https://') ||
            banner.link_url.startsWith('//')
          );
          
          const commonProps = {
            className: `flex-1 min-w-0 border rounded-lg transition-all shadow-sm group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation relative overflow-hidden ${
              banner.link_url ? 'cursor-pointer' : ''
            } border-gray-200`,
            style: {
              height: '210px',
              backgroundColor: banner.background_color || '#ffffff',
              color: banner.text_color || '#000000'
            }
          };
          
          // 링크가 있는 경우 처리
          if (banner.link_url) {
            if (isExternalLink) {
              // 외부 링크 - 새 탭에서 열기
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
              // 내부 링크 - Next.js Link 사용
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
            // 링크가 없는 경우
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
  );
} 
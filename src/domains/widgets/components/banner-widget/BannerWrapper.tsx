import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BannerWrapperProps, BANNER_HEIGHT } from './types';
import { Banner } from '../../types/banner';

// 이미지 배너 렌더링
export const renderImageBanner = (banner: Banner) => (
  <>
    {banner.image_url ? (
      <div className="absolute inset-0">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          className="object-cover md:rounded-lg"
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
        className="h-full flex flex-col justify-center items-center text-center p-4 md:rounded-lg"
        style={{ backgroundColor: banner.background_color, color: banner.text_color }}
      >
        <div className="text-lg font-bold">{banner.title}</div>
        {banner.subtitle && (
          <div className="text-sm opacity-75">{banner.subtitle}</div>
        )}
      </div>
    )}
  </>
);

// HTML 배너 렌더링
export const renderHtmlBanner = (banner: Banner) => (
  <div 
    className="h-full w-full"
    dangerouslySetInnerHTML={{ __html: banner.html_content || '' }}
  />
);

// 배너 콘텐츠 렌더링
export const renderBannerContent = (banner: Banner) => {
  switch (banner.type) {
    case 'image':
      return renderImageBanner(banner);
    case 'html':
      return renderHtmlBanner(banner);
    default:
      return renderImageBanner(banner);
  }
};

export default function BannerWrapper({ banner, children, index }: BannerWrapperProps) {
  const isExternalLink = banner.link_url && (
    banner.link_url.startsWith('http://') || 
    banner.link_url.startsWith('https://') ||
    banner.link_url.startsWith('//')
  );
  
  const commonProps = {
    className: `w-full border transition-all shadow-sm group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation active:scale-[0.99] transform-gpu select-none relative overflow-hidden ${
      banner.link_url ? 'cursor-pointer' : ''
    } border-gray-200 md:rounded-lg`,
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
} 
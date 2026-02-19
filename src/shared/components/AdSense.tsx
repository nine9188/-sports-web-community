'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// PC 배너 슬롯 (728x90)
const BANNER_SLOT = '8132343983';
// 모바일 배너 슬롯 (300x50 고정)
const MOBILE_BANNER_SLOT = '1917321828';
// md 브레이크포인트 (Tailwind 기준)
const MD_BREAKPOINT = 768;

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  adLayoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSense({
  adSlot,
  adFormat = 'auto',
  adLayoutKey,
  style = { display: 'block', width: '300px', height: '250px' },
  className,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // 화면 크기 감지 (배너 광고용)
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= MD_BREAKPOINT);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 광고 push
  useEffect(() => {
    const insElement = adRef.current;
    if (insElement && !insElement.dataset.adsbygoogleStatus) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // 이미 광고가 로드된 경우 무시
      }
    }
  }, [isDesktop]);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isBanner = adSlot === BANNER_SLOT;
  const isMobileBanner = adSlot === MOBILE_BANNER_SLOT;

  // 개발 환경 placeholder
  if (process.env.NODE_ENV === 'development') {
    if (isMobileBanner) {
      return (
        <div
          className={className}
          style={{
            width: '300px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            color: '#999',
            fontSize: '14px',
            margin: '0 auto',
          }}
        >
          모바일 광고 (300x50)
        </div>
      );
    }

    if (isBanner) {
      return isDesktop ? (
        <div
          className={className}
          style={{
            width: '728px',
            height: '90px',
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            color: '#999',
            fontSize: '14px',
            margin: '0 auto',
          }}
        >
          광고 영역 (728x90)
        </div>
      ) : (
        <div
          className={className}
          style={{
            width: '300px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            color: '#999',
            fontSize: '14px',
            margin: '0 auto',
          }}
        >
          광고 영역 (300x50)
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{
          width: style.width || '100%',
          height: style.height || '80px',
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          color: '#999',
          fontSize: '14px',
        }}
      >
        광고 영역
      </div>
    );
  }

  // 화면 크기 감지 전에는 렌더링하지 않음 (배너만)
  if ((isBanner || isMobileBanner) && isDesktop === null) return null;

  // 모바일 전용 배너: 300x50 고정
  if (isMobileBanner) {
    return (
      <div style={{ width: '300px', height: '50px', overflow: 'hidden', margin: '0 auto' }}>
        <ins
          ref={adRef}
          className={`adsbygoogle ${className || ''}`}
          style={{ display: 'inline-block', width: '300px', height: '50px' }}
          data-ad-client={clientId}
          data-ad-slot={MOBILE_BANNER_SLOT}
        />
      </div>
    );
  }

  // 배너: JS로 PC/모바일 완전 분리 (하나만 렌더링)
  if (isBanner) {
    if (isDesktop) {
      // PC: 728x90 고정
      return (
        <div style={{ width: '728px', height: '90px', overflow: 'hidden', margin: '0 auto' }}>
          <ins
            ref={adRef}
            className={`adsbygoogle ${className || ''}`}
            style={{ display: 'inline-block', width: '728px', height: '90px' }}
            data-ad-client={clientId}
            data-ad-slot={BANNER_SLOT}
          />
        </div>
      );
    } else {
      // 모바일: 300x50 고정 (별도 슬롯)
      return (
        <div style={{ width: '300px', height: '50px', overflow: 'hidden', margin: '0 auto' }}>
          <ins
            ref={adRef}
            className={`adsbygoogle ${className || ''}`}
            style={{ display: 'inline-block', width: '300px', height: '50px' }}
            data-ad-client={clientId}
            data-ad-slot={MOBILE_BANNER_SLOT}
          />
        </div>
      );
    }
  }

  // 일반 광고 (인피드 등)
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className || ''}`}
      style={style}
      data-ad-client={clientId}
      data-ad-slot={adSlot}
      {...{ 'data-ad-format': adFormat }}
      {...(adLayoutKey && { 'data-ad-layout-key': adLayoutKey })}
      {...(!adLayoutKey && { 'data-full-width-responsive': 'true' })}
    />
  );
}

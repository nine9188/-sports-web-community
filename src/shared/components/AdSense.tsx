'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// 배너보드 슬롯
const BANNER_SLOT = '8132343983';
// 모바일 배너 슬롯 (320x50 고정)
const MOBILE_BANNER_SLOT = '1917321828';

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
  const mobileAdRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // 메인 광고 push
    const insElement = adRef.current;
    if (insElement && !insElement.dataset.adsbygoogleStatus) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // 이미 광고가 로드된 경우 무시
      }
    }

    // 배너 모바일 광고 push
    const mobileInsElement = mobileAdRef.current;
    if (mobileInsElement && !mobileInsElement.dataset.adsbygoogleStatus) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // 이미 광고가 로드된 경우 무시
      }
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isBanner = adSlot === BANNER_SLOT;

  if (process.env.NODE_ENV === 'development') {
    if (isBanner) {
      return (
        <>
          {/* 데스크탑: 728x90 */}
          <div
            className={`hidden md:flex ${className || ''}`}
            style={{
              width: '728px',
              height: '90px',
              maxWidth: '100%',
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
          {/* 모바일: 320x50 고정 */}
          <div
            className={`md:hidden ${className || ''}`}
            style={{
              width: '320px',
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
            광고 영역 (320x50)
          </div>
        </>
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

  // 배너: 데스크탑 728x90 고정 + 모바일 320x50 고정
  if (isBanner) {
    return (
      <>
        {/* 데스크탑: 728x90 고정 */}
        <div className="hidden md:block" style={{ textAlign: 'center' }}>
          <ins
            ref={adRef}
            className={`adsbygoogle ${className || ''}`}
            style={{ display: 'inline-block', width: '728px', height: '90px' }}
            data-ad-client={clientId}
            data-ad-slot={adSlot}
          />
        </div>
        {/* 모바일: 320x50 고정 */}
        <div className="md:hidden" style={{ textAlign: 'center' }}>
          <ins
            ref={mobileAdRef}
            className={`adsbygoogle ${className || ''}`}
            style={{ display: 'inline-block', width: '320px', height: '50px' }}
            data-ad-client={clientId}
            data-ad-slot={MOBILE_BANNER_SLOT}
          />
        </div>
      </>
    );
  }

  // 일반 광고
  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className || ''}`}
      style={style}
      data-ad-client={clientId}
      data-ad-slot={adSlot}
      {...(!isBanner && { 'data-ad-format': adFormat })}
      {...(adLayoutKey && { 'data-ad-layout-key': adLayoutKey })}
      {...(!adLayoutKey && { 'data-full-width-responsive': 'true' })}
    />
  );
}

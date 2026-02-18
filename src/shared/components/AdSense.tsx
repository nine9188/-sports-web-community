'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

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

  useEffect(() => {
    const insElement = adRef.current;
    if (!insElement || insElement.dataset.adsbygoogleStatus) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // 이미 광고가 로드된 경우 무시
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className={className}
        style={{
          width: style.width || '100%',
          height: style.height || '80px',
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

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className || ''}`}
      style={style}
      data-ad-client={clientId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(adLayoutKey && { 'data-ad-layout-key': adLayoutKey })}
      {...(!adLayoutKey && { 'data-full-width-responsive': 'true' })}
    />
  );
}

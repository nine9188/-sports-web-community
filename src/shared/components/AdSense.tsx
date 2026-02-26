'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE } from '@/shared/constants/ad-constants';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdSenseProps {
  adSlot: string;
  width: number;
  height: number;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string;
  className?: string;
}

export default function AdSense({
  adSlot,
  width,
  height,
  format,
  layoutKey,
  className,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = adRef.current;
    if (el && !el.dataset.adsbygoogleStatus) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // 이미 로드된 경우 무시
      }
    }
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className={className}
        style={{
          width: `${width}px`,
          height: `${height}px`,
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
        광고 ({width}x{height})
      </div>
    );
  }

  // fluid 포맷
  if (format === 'fluid') {
    return (
      <ins
        ref={adRef}
        className={`adsbygoogle ${className || ''}`}
        style={{ display: 'block' }}
        data-ad-client={ADSENSE.CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="fluid"
        {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      />
    );
  }

  // 고정 크기 광고
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, overflow: 'hidden' }}>
      <ins
        ref={adRef}
        className={`adsbygoogle ${className || ''}`}
        style={{ display: 'inline-block', width: `${width}px`, height: `${height}px` }}
        data-ad-client={ADSENSE.CLIENT_ID}
        data-ad-slot={adSlot}
      />
    </div>
  );
}

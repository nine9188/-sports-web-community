'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [noFill, setNoFill] = useState(false);

  useEffect(() => {
    const el = adRef.current;
    if (!el || el.dataset.adsbygoogleStatus) return;

    setNoFill(false);

    const checkAdStatus = () => {
      if (el.dataset.adStatus === 'unfilled') {
        setNoFill(true);
      }
    };

    const observer = new MutationObserver(checkAdStatus);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
    });

    const timeout = window.setTimeout(() => {
      if (!el.dataset.adsbygoogleStatus && el.childElementCount === 0) {
        setNoFill(true);
      }
    }, 6000);

    const tryPush = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // 이미 로드된 경우 무시
      }
    };

    // adsbygoogle 스크립트가 이미 로드되었으면 즉시 push
    if (window.adsbygoogle && window.adsbygoogle.length !== undefined) {
      tryPush();
      return () => {
        observer.disconnect();
        window.clearTimeout(timeout);
      };
    }

    // 아직 로드 안 됐으면 대기 (lazyOnload 스크립트와 호환)
    const interval = setInterval(() => {
      if (typeof window.adsbygoogle !== 'undefined') {
        tryPush();
        clearInterval(interval);
      }
    }, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [adSlot]);

  if (process.env.NODE_ENV === 'development') {
    // fluid 포맷은 전체 너비, 자동 높이로 표시
    if (format === 'fluid') {
      return (
        <div
          className={className}
          style={{
            width: '100%',
            padding: '16px 0',
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
          광고 (fluid)
        </div>
      );
    }

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
    if (noFill) return null;

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
  if (noFill) return null;

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

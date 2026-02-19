'use client';

import { useEffect, useRef } from 'react';

interface KakaoAdProps {
  adUnit: string;
  adWidth: number;
  adHeight: number;
  className?: string;
}

export default function KakaoAd({
  adUnit,
  adWidth,
  adHeight,
  className,
}: KakaoAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 이미 스크립트가 추가되었으면 스킵
    if (container.querySelector('script')) return;

    // 각 광고 인스턴스마다 개별 스크립트 삽입 (ba.min.js가 새 ins를 감지하도록)
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    container.appendChild(script);
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className={className}
        style={{
          width: `${adWidth}px`,
          height: `${adHeight}px`,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FEE500',
          border: '2px dashed #3C1E1E',
          borderRadius: '8px',
          color: '#3C1E1E',
          fontSize: '14px',
          margin: '0 auto',
        }}
      >
        카카오 광고 ({adWidth}x{adHeight})
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={adUnit}
        data-ad-width={String(adWidth)}
        data-ad-height={String(adHeight)}
      />
    </div>
  );
}

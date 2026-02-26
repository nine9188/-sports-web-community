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

    // 기존 스크립트 태그 제거 후 새로 추가하여 SDK가 ins를 처리하도록 함
    const oldScript = container.querySelector('script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    container.appendChild(script);

    return () => {
      const s = container.querySelector('script');
      if (s) s.remove();
    };
  }, [adUnit, adWidth, adHeight]);

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
        }}
      >
        카카오 ({adWidth}x{adHeight})
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

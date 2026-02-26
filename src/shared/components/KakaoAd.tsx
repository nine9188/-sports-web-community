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

    // 매 마운트마다 ins + script를 동적 생성하여
    // 클라이언트 네비게이션에서도 카카오 SDK가 광고를 렌더링하도록 함
    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit', adUnit);
    ins.setAttribute('data-ad-width', String(adWidth));
    ins.setAttribute('data-ad-height', String(adHeight));

    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;

    container.appendChild(ins);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
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

  return <div ref={containerRef} className={className} />;
}

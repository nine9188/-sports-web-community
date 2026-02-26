'use client';

import { useEffect, useRef } from 'react';

interface KakaoAdProps {
  adUnit: string;
  adWidth: number;
  adHeight: number;
  className?: string;
}

// 글로벌 스크립트 로드 상태
let scriptLoaded = false;

function loadKakaoScript() {
  if (scriptLoaded) return;
  if (document.querySelector('script[src*="kas/static/ba.min.js"]')) {
    scriptLoaded = true;
    return;
  }
  const script = document.createElement('script');
  script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
  script.async = true;
  document.head.appendChild(script);
  scriptLoaded = true;
}

export default function KakaoAd({
  adUnit,
  adWidth,
  adHeight,
  className,
}: KakaoAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKakaoScript();
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

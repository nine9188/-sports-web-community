'use client';

import { useState, useEffect } from 'react';
import AdSense from './AdSense';
import { ADSENSE } from '@/shared/constants/ad-constants';

/**
 * 페이지 배너 광고
 *
 * LCP 최적화:
 * - 초기: 고정 높이 placeholder만 렌더 (CLS 방지)
 * - LCP 이후: requestIdleCallback으로 실제 광고 마운트
 * → 광고가 LCP 후보에서 제외됨
 *
 * CSS로 PC/모바일 분기:
 * - PC (md 이상): 728x90
 * - 모바일 (md 미만): 320x100
 */
export default function AdBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // LCP 측정 완료 후 광고 로드
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    // fallback: 1초 후 로드
    const timer = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* PC 배너 - 728x90 */}
      <div className="hidden md:flex justify-center">
        <div style={{ width: 728, height: 90 }}>
          {ready && <AdSense adSlot={ADSENSE.PC_BANNER} width={728} height={90} />}
        </div>
      </div>
      {/* 모바일 배너 - 320x100 */}
      <div className="md:hidden flex justify-center">
        <div style={{ width: 320, height: 100, maxWidth: '100%' }}>
          {ready && <AdSense adSlot={ADSENSE.MOBILE_BANNER} width={320} height={100} />}
        </div>
      </div>
    </>
  );
}

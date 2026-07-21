'use client';

import { useState, useEffect } from 'react';
import SmartAdRelay from './SmartAdRelay';
import { KAKAO } from '@/shared/constants/ad-constants';

/**
 * 페이지 통합 스마트 멀티 광고 배너
 *
 * - PC (md 이상): 728x90 (1순위 클릭몬/카카오 ➔ 미송출 시 노란색 4590 카드)
 * - 모바일 (md 미만): 320x100 (1순위 클릭몬/카카오 ➔ 미송출 시 노란색 4590 카드)
 */
export default function AdBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout: 500 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* PC 배너 - 728x90 */}
      <div className="hidden md:flex justify-center my-3">
        <div style={{ width: 728, height: 90, maxWidth: '100%' }}>
          {ready && (
            <SmartAdRelay
              slotType="header"
              kakaoAdUnit={KAKAO.POST_PC_BANNER}
              adWidth={728}
              adHeight={90}
            />
          )}
        </div>
      </div>

      {/* 모바일 배너 - 320x100 */}
      <div className="md:hidden flex justify-center my-2">
        <div style={{ width: 320, height: 100, maxWidth: '100%' }}>
          {ready && (
            <SmartAdRelay
              slotType="header"
              kakaoAdUnit={KAKAO.MOBILE_BANNER}
              adWidth={320}
              adHeight={100}
            />
          )}
        </div>
      </div>
    </>
  );
}

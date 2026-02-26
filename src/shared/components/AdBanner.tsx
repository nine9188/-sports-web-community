'use client';

import AdSense from './AdSense';
import { ADSENSE } from '@/shared/constants/ad-constants';

/**
 * 페이지 배너 광고
 *
 * CSS로 PC/모바일 분기:
 * - PC (md 이상): 728x90
 * - 모바일 (md 미만): 300x50
 */
export default function AdBanner() {
  return (
    <>
      {/* PC 배너 */}
      <div className="hidden md:flex justify-center">
        <AdSense adSlot={ADSENSE.PC_BANNER} width={728} height={90} />
      </div>
      {/* 모바일 배너 */}
      <div className="md:hidden flex justify-center">
        <AdSense adSlot={ADSENSE.MOBILE_BANNER} width={320} height={100} />
      </div>
    </>
  );
}

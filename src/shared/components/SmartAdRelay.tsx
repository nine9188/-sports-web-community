'use client';

import { useState, useEffect } from 'react';
import KakaoAd from './KakaoAd';
import CoupangPartnersAd from './CoupangPartnersAd';
import ClickmonAd from './ClickmonAd';

interface SmartAdRelayProps {
  adWidth: number;
  adHeight: number;
  kakaoAdUnit?: string;
  clickmonScriptUrl?: string;
  coupangTrackingCode?: string;
  coupangCustomBannerUrl?: string;
  slotType?: 'header' | 'content' | 'sidebar' | 'left-sidebar' | 'modal';
  className?: string;
}

type NetworkType = 'coupang' | 'clickmon' | 'kakao';

export default function SmartAdRelay({
  adWidth,
  adHeight,
  kakaoAdUnit,
  clickmonScriptUrl,
  coupangTrackingCode,
  coupangCustomBannerUrl,
  slotType = 'header',
  className,
}: SmartAdRelayProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('coupang');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 페이지 로드 / 마운트 시마다 무작위 추첨 (쿠팡 40% : 클릭몬 35% : 카카오 25%)
    const rand = Math.random();
    if (rand < 0.4) {
      setSelectedNetwork('coupang');
    } else if (rand < 0.75) {
      setSelectedNetwork('clickmon');
    } else {
      setSelectedNetwork('kakao');
    }
  }, []);

  if (!isMounted) {
    // SSR 하이드레이션 렌더링 시에는 쿠팡 파트너스 배너를 기본 렌더링
    return (
      <CoupangPartnersAd
        adWidth={adWidth}
        adHeight={adHeight}
        className={className}
        trackingCode={coupangTrackingCode || process.env.NEXT_PUBLIC_COUPANG_TRACKING_CODE || 'AF3145564'}
        customBannerUrl={coupangCustomBannerUrl || process.env.NEXT_PUBLIC_COUPANG_BANNER_URL}
      />
    );
  }

  // 1. 쿠팡 파트너스 당첨 시
  if (selectedNetwork === 'coupang') {
    return (
      <CoupangPartnersAd
        adWidth={adWidth}
        adHeight={adHeight}
        className={className}
        trackingCode={coupangTrackingCode || process.env.NEXT_PUBLIC_COUPANG_TRACKING_CODE || 'AF3145564'}
        customBannerUrl={coupangCustomBannerUrl || process.env.NEXT_PUBLIC_COUPANG_BANNER_URL}
      />
    );
  }

  // 2. 클릭몬 당첨 시
  if (selectedNetwork === 'clickmon') {
    return (
      <ClickmonAd
        adWidth={adWidth}
        adHeight={adHeight}
        className={className}
        scriptUrl={clickmonScriptUrl || process.env.NEXT_PUBLIC_CLICKMON_SCRIPT_URL}
      />
    );
  }

  // 3. 카카오 애드핏 당첨 시 (카카오 미송출 시 노란색 4590 광고 문의 카드로 자동 백업)
  return (
    <KakaoAd
      adUnit={kakaoAdUnit || ''}
      adWidth={adWidth}
      adHeight={adHeight}
      className={className}
    />
  );
}

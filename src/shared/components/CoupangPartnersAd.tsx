'use client';

import Link from 'next/link';
import { ShoppingBag, Flame, ExternalLink } from 'lucide-react';

interface CoupangPartnersAdProps {
  adWidth?: number;
  adHeight?: number;
  className?: string;
  trackingCode?: string;
  customBannerUrl?: string;
}

// 쿠팡 300x250 사각형 캐러셀 다이내믹 배너 URL (id=1008770)
const DEFAULT_SQUARE_COUPANG_BANNER_URL =
  'https://ads-partners.coupang.com/widgets.html?id=1008770&template=carousel&trackingCode=AF3145564&subId=&width=300&height=250&tsource=';

// 쿠팡 728x90 가로형 캐러셀 다이내믹 배너 URL (id=1008773)
const DEFAULT_WIDE_COUPANG_BANNER_URL =
  'https://ads-partners.coupang.com/widgets.html?id=1008773&template=carousel&trackingCode=AF3145564&subId=&width=728&height=90&tsource=';

export default function CoupangPartnersAd({
  adWidth = 300,
  adHeight = 250,
  className,
  trackingCode = 'AF3145564',
  customBannerUrl,
}: CoupangPartnersAdProps) {
  // 구좌 크기에 맞춰 728x90 가로형(id=1008773) vs 300x250 사각형(id=1008770) 쿠팡 다이내믹 배너 자동 매칭
  const targetBannerUrl =
    customBannerUrl ||
    process.env.NEXT_PUBLIC_COUPANG_BANNER_URL ||
    (adWidth >= 600 ? DEFAULT_WIDE_COUPANG_BANNER_URL : DEFAULT_SQUARE_COUPANG_BANNER_URL);

  if (targetBannerUrl) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-black/5 dark:border-white/10 ${className || ''}`}
        style={{ width: `${adWidth}px`, height: `${adHeight}px`, maxWidth: '100%' }}
      >
        <iframe
          src={targetBannerUrl}
          width={adWidth}
          height={adHeight}
          frameBorder="0"
          scrolling="no"
          referrerPolicy="unsafe-url"
          className="border-0 overflow-hidden shrink-0"
          style={{ width: `${adWidth}px`, height: `${adHeight}px`, maxWidth: '100%' }}
        />
      </div>
    );
  }

  const coupangSearchUrl = `https://link.coupang.com/a/${trackingCode}?page=search&q=%EC%B6%95%EA%B5%AC%ED%99%94`;

  return (
    <Link
      href={coupangSearchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex items-center justify-between overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white p-5 shadow-md ${className || ''}`}
      style={{ width: `${adWidth}px`, height: `${adHeight}px`, maxWidth: '100%' }}
    >
      <div className="z-10 flex items-center justify-between w-full">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-md">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md">
          <Flame className="h-3 w-3 text-yellow-300 animate-bounce" />
          쿠팡 핫딜
        </span>
      </div>
    </Link>
  );
}

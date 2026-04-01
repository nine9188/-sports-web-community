'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { fetchBannerTransfers } from '@/domains/livescore/actions/transfers/bannerTransfers';
import type { BannerTransferItem } from '@/domains/livescore/actions/transfers/bannerTransfers';

interface TransferTickerProps {
  items?: BannerTransferItem[];
}

export default function TransferTicker({ items: initialItems }: TransferTickerProps) {
  const [paused, setPaused] = useState(false);

  // 서버에서 전달받은 초기 데이터가 없으면 클라이언트에서 자체 fetch
  const { data: fetchedItems } = useQuery({
    queryKey: ['bannerTransfers'],
    queryFn: () => fetchBannerTransfers(20),
    staleTime: 5 * 60 * 1000,
    enabled: !initialItems || initialItems.length === 0,
  });

  const items = initialItems && initialItems.length > 0 ? initialItems : fetchedItems;

  if (!items || items.length === 0) return null;

  const duplicated = [...items, ...items];

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
      <div className="w-full max-w-[1360px] mx-auto px-4 flex items-center gap-2 py-2 min-h-[44px]">
        {/* 롤링 영역 */}
        <div
          className="flex-1 flex items-center overflow-hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* 우측 페이드 */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F5F5] dark:from-[#262626] to-transparent z-10 pointer-events-none" />

          <div
            className="flex items-center gap-3"
            style={{
              animation: `ticker ${items.length * 5}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            {duplicated.map((item, idx) => (
              <div
                key={`${item.playerId}-${idx}`}
                className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 shrink-0"
              >
                <Link
                  href="/transfers"
                  className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors whitespace-nowrap"
                >
                  {item.playerName}
                </Link>

                <div className="w-[14px] h-[14px] flex-shrink-0">
                  <UnifiedSportsImageClient
                    src={item.teamOutLogo}
                    alt={item.teamOutName}
                    width={14}
                    height={14}
                    fit="contain"
                  />
                </div>

                <span className="text-gray-400 dark:text-gray-500">→</span>

                <div className="w-[14px] h-[14px] flex-shrink-0">
                  <UnifiedSportsImageClient
                    src={item.teamInLogo}
                    alt={item.teamInName}
                    width={14}
                    height={14}
                    fit="contain"
                  />
                </div>

                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {item.transferTypeFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

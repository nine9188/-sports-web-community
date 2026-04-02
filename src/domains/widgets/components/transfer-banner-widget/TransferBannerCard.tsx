'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
} from '@/shared/components/ui';
import type { BannerTransferItem } from '@/domains/livescore/actions/transfers/bannerTransfers';

interface TransferBannerCardProps {
  items: BannerTransferItem[];
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function TransferBannerCard({ items }: TransferBannerCardProps) {
  const isMobile = useIsMobile();
  const perPage = isMobile ? 3 : 4;
  const totalPages = Math.ceil(items.length / perPage);
  const [page, setPage] = useState(0);

  // 페이지 리셋 (모바일↔데스크탑 전환 시)
  useEffect(() => {
    setPage(0);
  }, [isMobile]);

  const next = useCallback(() => {
    setPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  // 4초마다 페이지 전환
  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, totalPages]);

  if (!items || items.length === 0) return null;

  const pageItems = items.slice(page * perPage, page * perPage + perPage);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] max-md:border max-md:border-black/7 max-md:dark:border-0">
      <ContainerHeader className="justify-between">
        <div className="flex items-center gap-2">
          <ContainerTitle>최근 이적</ContainerTitle>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === page
                      ? 'bg-gray-900 dark:bg-[#F0F0F0]'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`${idx + 1}페이지`}
                />
              ))}
            </div>
          )}
        </div>
        <Link
          href="/transfers"
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
        >
          이적센터
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </ContainerHeader>

      <div className="bg-white dark:bg-[#1D1D1D] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${perPage}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="grid grid-cols-3 md:grid-cols-4 divide-x divide-black/5 dark:divide-white/10"
          >
            {pageItems.map((item) => (
              <Link
                key={`${item.playerId}-${item.transferDate}`}
                href="/transfers"
                className="flex flex-col items-center gap-2 px-3 py-4 md:hover:bg-[#EAEAEA] md:dark:hover:bg-[#333333] transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex-shrink-0">
                  <UnifiedSportsImageClient
                    src={item.playerPhoto}
                    alt={item.playerName}
                    width={40}
                    height={40}
                    fit="cover"
                    className="w-full h-full"
                  />
                </div>

                <p className="text-[12px] md:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] text-center line-clamp-1 w-full">
                  {item.playerName}
                </p>

                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 flex-shrink-0">
                    <UnifiedSportsImageClient
                      src={item.teamOutLogo}
                      alt={item.teamOutName}
                      width={20}
                      height={20}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">→</span>
                  <div className="w-5 h-5 flex-shrink-0">
                    <UnifiedSportsImageClient
                      src={item.teamInLogo}
                      alt={item.teamInName}
                      width={20}
                      height={20}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.transferTypeColor}`}>
                  {item.transferTypeFormatted}
                </span>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </Container>
  );
}

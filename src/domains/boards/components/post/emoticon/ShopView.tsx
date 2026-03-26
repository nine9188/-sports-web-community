"use client";

import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { type EmoticonPackInfo } from '@/domains/boards/actions/emoticons';
import { useEmoticonShopData } from '@/domains/boards/hooks/useEmoticonQueries';
import { Button, Container, ContainerContent } from '@/shared/components/ui';
import { DESKTOP_CONTENT_HEIGHT } from './constants';

const SHOP_COLS_DESKTOP = 5;
const SHOP_ROWS_DESKTOP = 3;
const SHOP_MAX_DESKTOP = SHOP_COLS_DESKTOP * SHOP_ROWS_DESKTOP;
const SHOP_COLS_MOBILE = 3;
const SHOP_ROWS_MOBILE = 3;
const SHOP_MAX_MOBILE = SHOP_COLS_MOBILE * SHOP_ROWS_MOBILE;

type ShopFilter = 'popular' | 'new' | 'free';

const FILTER_TABS: { key: ShopFilter; label: string }[] = [
  { key: 'popular', label: '인기' },
  { key: 'new', label: '신규' },
  { key: 'free', label: '무료' },
];

interface ShopViewProps {
  isMobile: boolean;
  onBack: () => void;
  onPackClick: (packId: string) => void;
}

function PackCard({
  pack,
  isOwned,
  isMobile,
  onClick,
}: {
  pack: EmoticonPackInfo;
  isOwned: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const isFree = !pack.shop_item_id || pack.price === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-1 rounded-md border border-black/7 dark:border-0 bg-white dark:bg-[#262626] shadow-sm hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-all group"
    >
      <div className={`${isMobile ? 'w-12 h-12' : 'w-[60px] h-[60px]'} flex items-center justify-center`}>
        <Image
          src={pack.pack_thumbnail}
          alt={pack.pack_name}
          width={60}
          height={60}
          className="w-[60px] h-[60px] object-contain group-hover:scale-105 transition-transform"
        />
      </div>
      <p className="text-[10px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate w-full text-center leading-tight mt-1.5 px-1">
        {pack.pack_name}
      </p>
      <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 leading-none">{pack.emoticon_count}개</p>
      <div className="leading-none">
        {isOwned ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 dark:text-gray-400 font-medium px-1 rounded-full bg-[#F5F5F5] dark:bg-[#333333]">
            <Check className="w-2 h-2" />보유
          </span>
        ) : isFree ? (
          <span className="inline-flex items-center text-[9px] text-green-600 dark:text-green-400 font-medium px-1 rounded-full bg-green-50 dark:bg-green-900/20">
            무료
          </span>
        ) : (
          <span className="text-[9px] tabular-nums font-semibold text-gray-900 dark:text-[#F0F0F0]">
            {pack.price?.toLocaleString()} P
          </span>
        )}
      </div>
    </button>
  );
}

export default function ShopView({ isMobile, onBack, onPackClick }: ShopViewProps) {
  const { data: shopData, isLoading, isError, refetch } = useEmoticonShopData();
  const [filter, setFilter] = useState<ShopFilter>('popular');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isOwned = (pack: EmoticonPackInfo) => {
    if (!pack.shop_item_id) return true;
    return shopData?.ownedItemIds.includes(pack.shop_item_id) ?? false;
  };

  const browsePacks = useMemo((): EmoticonPackInfo[] => {
    if (!shopData) return [];
    let packs = [...shopData.packs];
    if (filter === 'free') {
      packs = packs.filter(p => !p.shop_item_id || p.price === 0);
    } else if (filter === 'new') {
      packs = packs.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      // 인기: 구매 수 내림차순
      packs = packs.sort((a, b) => (b.purchase_count ?? 0) - (a.purchase_count ?? 0));
    }
    return packs.slice(0, isMobile ? SHOP_MAX_MOBILE : SHOP_MAX_DESKTOP);
  }, [shopData, filter, isMobile]);

  const searchResults = useMemo((): EmoticonPackInfo[] => {
    if (!shopData || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return shopData.packs.filter(p => p.pack_name.toLowerCase().includes(q));
  }, [shopData, query]);

  const isSearching = query.trim().length > 0;
  const totalSlots = isMobile ? SHOP_MAX_MOBILE : SHOP_MAX_DESKTOP;

  const toolbar = (
    <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>돌아가기</span>
      </button>
      {shopData?.isLoggedIn && (
        <span className="text-xs tabular-nums font-medium text-gray-500 dark:text-gray-400">
          보유 {shopData.userPoints.toLocaleString()} P
        </span>
      )}
    </div>
  );

  const footer = (
    <div className={`flex items-center justify-center border-t border-black/5 dark:border-white/10 h-[64px] flex-shrink-0 ${isMobile ? 'mb-10' : ''}`}>
      <Link href="/shop?category=emoticon-packs" className="text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
        이모티콘 상점 바로가기 →
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className={"flex flex-col flex-1 min-h-0 overflow-hidden"}>
        {toolbar}
        <div className={isMobile ? 'flex-1 min-h-0' : DESKTOP_CONTENT_HEIGHT} />
        {footer}
      </div>
    );
  }

  if (isError || !shopData) {
    return (
      <div className={"flex flex-col flex-1 min-h-0 overflow-hidden"}>
        {toolbar}
        <div className={`flex flex-col items-center justify-center gap-2 ${isMobile ? 'flex-1 min-h-0' : DESKTOP_CONTENT_HEIGHT}`}>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오기 실패</p>
          <button type="button" onClick={() => refetch()} className="text-xs text-gray-500 hover:underline">다시 시도</button>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className={"flex flex-col flex-1 min-h-0 overflow-hidden"}>
      {toolbar}

      <div className={`${isMobile ? 'flex-1 min-h-0' : DESKTOP_CONTENT_HEIGHT} flex flex-col ${isMobile ? 'px-3 py-3' : 'px-4 py-3'}`}>
        {/* 필터 + 검색 */}
        <div className="border border-black/7 dark:border-0 rounded-md bg-white dark:bg-[#262626] shadow-sm flex-shrink-0 mb-2">
          <div className="px-4 py-2.5">
            <nav className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-shrink-0">
                {FILTER_TABS.map(tab => (
                  <Button
                    key={tab.key}
                    type="button"
                    variant="ghost"
                    onClick={() => setFilter(tab.key)}
                    className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 ${
                      filter === tab.key ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                    }`}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              <div className="relative flex-1 max-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="이모티콘 팩 검색..."
                  className="w-full pl-9 pr-8 py-1 text-[13px] bg-transparent text-gray-900 dark:text-[#F0F0F0] rounded-lg placeholder-gray-500 outline-none focus:outline-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* 팩 그리드 */}
        <div
          data-emoticon-scroll
          className={`${isMobile ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : 'flex-1 overflow-y-auto'}`}
        >
          {isSearching && searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-gray-400 dark:text-gray-500">'{query}' 검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className={`grid ${isMobile ? 'grid-cols-3 gap-1.5' : 'grid-cols-5 gap-2'}`}>
              {isSearching
                ? searchResults.map(pack => (
                    <PackCard key={pack.pack_id} pack={pack} isOwned={isOwned(pack)} isMobile={isMobile} onClick={() => onPackClick(pack.pack_id)} />
                  ))
                : Array.from({ length: totalSlots }).map((_, idx) => {
                    const pack = browsePacks[idx];
                    if (!pack) return <div key={`empty-${idx}`} />;
                    return (
                      <PackCard key={pack.pack_id} pack={pack} isOwned={isOwned(pack)} isMobile={isMobile} onClick={() => onPackClick(pack.pack_id)} />
                    );
                  })
              }
            </div>
          )}
        </div>
      </div>

      {footer}
    </div>
  );
}

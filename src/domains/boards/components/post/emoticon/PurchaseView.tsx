"use client";

import React, { useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { type EmoticonPackInfo } from '@/domains/boards/actions/emoticons';
import { purchaseItem } from '@/domains/shop/actions/actions';
import { useEmoticonShopData, useEmoticonInvalidation } from '@/domains/boards/hooks/useEmoticonQueries';
import { DESKTOP_CONTENT_HEIGHT } from './constants';

interface PurchaseViewProps {
  pack: EmoticonPackInfo;
  isMobile: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export default function PurchaseView({ pack, isMobile, onBack, onComplete }: PurchaseViewProps) {
  const { data: shopData } = useEmoticonShopData();
  const { invalidateAfterPurchase } = useEmoticonInvalidation();
  const [isPending, startTransition] = useTransition();

  const userPoints = shopData?.userPoints ?? 0;
  const remaining = userPoints - (pack.price || 0);
  const affordable = remaining >= 0;

  const handleConfirm = () => {
    if (!pack.shop_item_id) return;

    startTransition(async () => {
      try {
        await purchaseItem(pack.shop_item_id!);
        toast.success(`${pack.pack_name} 팩을 구매했습니다!`);
        invalidateAfterPurchase(pack.pack_id);
        onComplete();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '구매에 실패했습니다.');
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>구매 확인</span>
        </button>
      </div>

      {/* 콘텐츠 */}
      <div
        data-emoticon-scroll
        className={`${isMobile ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : `${DESKTOP_CONTENT_HEIGHT} overflow-y-auto`} px-4 py-4`}
      >
        {shopData && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] mb-4">
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1D1D1D] flex items-center justify-center flex-shrink-0">
                <Image src={pack.pack_thumbnail} alt={pack.pack_name} width={32} height={32} className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">{pack.pack_name} 팩</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pack.emoticon_count}개 이모티콘</p>
              </div>
              <span className="text-[13px] font-bold tabular-nums text-gray-900 dark:text-[#F0F0F0] flex-shrink-0">
                {(pack.price || 0).toLocaleString()} P
              </span>
            </div>

            <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-gray-700 dark:text-gray-300">보유 포인트</span>
                <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()} P</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-gray-700 dark:text-gray-300">가격</span>
                <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">- {(pack.price || 0).toLocaleString()} P</span>
              </div>
              <div className="border-t border-black/5 dark:border-white/10 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{affordable ? '남는 포인트' : '부족한 포인트'}</span>
                  <span className={`text-base font-bold tabular-nums ${affordable ? 'text-gray-900 dark:text-[#F0F0F0]' : 'text-red-600 dark:text-red-400'}`}>
                    {Math.abs(remaining).toLocaleString()} P
                  </span>
                </div>
              </div>
            </div>

            {!affordable && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">포인트가 부족합니다.</p>
            )}
          </>
        )}
      </div>

      {/* 푸터 */}
      <div className={`flex items-center gap-2 px-4 border-t border-black/5 dark:border-white/10 h-[64px] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)] ${isMobile ? 'mb-10' : ''}`}>
        <button type="button" onClick={onBack}
          className="flex-1 h-10 rounded-lg text-[13px] font-medium bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
          취소
        </button>
        <button type="button" onClick={handleConfirm} disabled={!affordable || isPending}
          className="flex-1 h-10 rounded-lg text-[13px] font-medium bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isPending ? '처리 중...' : '구매하기'}
        </button>
      </div>
    </div>
  );
}

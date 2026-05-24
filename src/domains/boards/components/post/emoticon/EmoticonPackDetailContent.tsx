"use client";

import React from 'react';
import { Check, Lock } from 'lucide-react';
import Image from 'next/image';
import { type EmoticonPackInfo } from '@/domains/boards/actions/emoticons';
import { usePackDetail } from '@/domains/boards/hooks/useEmoticonQueries';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl, SITE_ICON_URL } from '@/shared/images/urls';

interface EmoticonPackDetailContentProps {
  packId: string;
  isMobile: boolean;
  onPurchaseClick: (pack: EmoticonPackInfo) => void;
  ownedItemIds?: number[];
  guestPurchaseHref?: string;
  className?: string;
}

export default function EmoticonPackDetailContent({
  packId,
  isMobile,
  onPurchaseClick,
  ownedItemIds,
  guestPurchaseHref,
  className,
}: EmoticonPackDetailContentProps) {
  const { data: detail } = usePackDetail(packId);
  const isOwned = Boolean(
    detail?.isOwned || (
      detail?.shop_item_id && ownedItemIds?.includes(detail.shop_item_id)
    )
  );
  const thumbnail = detail
    ? normalizeDisplayImageUrl(detail.pack_thumbnail, { fallback: SITE_ICON_URL, proxyExternal: true })
    : SITE_ICON_URL;
  const isGuestPurchase = Boolean(guestPurchaseHref);
  const previewEmoticons = detail
    ? isGuestPurchase
      ? detail.emoticons.slice(0, 6)
      : detail.emoticons
    : [];
  const guestLoginHref = guestPurchaseHref ?? '/signin';

  const handlePurchaseClick = () => {
    if (!detail) return;
    onPurchaseClick({
      pack_id: detail.pack_id,
      pack_name: detail.pack_name,
      pack_thumbnail: detail.pack_thumbnail,
      pack_creator: detail.pack_creator,
      pack_description: detail.pack_description,
      shop_item_id: detail.shop_item_id,
      emoticon_count: detail.emoticon_count,
      price: detail.price,
      purchase_count: 0,
      created_at: null,
    });
  };

  return (
    <div className={`flex flex-col flex-1 min-h-0${className ? ` ${className}` : ''}`}>
      {/* 팩 정보 - 고정 */}
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex-shrink-0">
        {detail && (
          isMobile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-[48px] h-[48px] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image src={thumbnail} alt={detail.pack_name} width={48} height={48} unoptimized={shouldUnoptimizeImageUrl(thumbnail)} className="w-[48px] h-[48px] object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0] truncate">{detail.pack_name}</p>
                  {detail.pack_creator && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">제작: {detail.pack_creator}</p>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{detail.emoticon_count}개 이모티콘</p>
                </div>
                <span className="text-[13px] tabular-nums font-bold text-gray-900 dark:text-[#F0F0F0] flex-shrink-0">
                  {detail.isFree ? '무료' : `${(detail.price ?? 0).toLocaleString()} P`}
                </span>
              </div>
              <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                  {detail.pack_description || '설명이 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-stretch gap-3">
              <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center flex-shrink-0">
                <Image src={thumbnail} alt={detail.pack_name} width={60} height={60} unoptimized={shouldUnoptimizeImageUrl(thumbnail)} className="w-[60px] h-[60px] object-contain" />
              </div>
              <div className="flex flex-col min-w-0 w-[20%] flex-shrink-0">
                <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">{detail.pack_name}</p>
                {detail.pack_creator && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">제작: {detail.pack_creator}</p>
                )}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{detail.emoticon_count}개 이모티콘</p>
                <span className="text-[11px] tabular-nums font-bold text-gray-900 dark:text-[#F0F0F0] mt-auto">
                  {detail.isFree ? '무료' : `${(detail.price ?? 0).toLocaleString()} P`}
                </span>
              </div>
              <div className="flex-1 min-w-0 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {detail.pack_description || '설명이 없습니다.'}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* 이모티콘 미리보기 - 스크롤 */}
      <div
        data-emoticon-scroll
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {detail && (
          <>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">이모티콘 미리보기</p>
            <div className={`grid ${isMobile ? 'grid-cols-4 gap-2' : 'grid-cols-6 gap-2'}`}>
              {previewEmoticons.map((emo) => (
                <div
                  key={emo.id}
                  className="aspect-square flex items-center justify-center p-1 rounded"
                  title={emo.name}
                >
                  <Image src={emo.url} alt={emo.name} width={60} height={60} className={`${isMobile ? 'w-[52px] h-[52px]' : 'w-[60px] h-[60px]'} object-contain`} />
                </div>
              ))}
            </div>
            {isGuestPurchase && (
              <div className="mt-4 rounded-lg border border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-4 text-center">
                <Lock className="mx-auto mb-2 h-6 w-6 text-gray-500 dark:text-gray-400" />
                <p className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">회원을 위한 구매 화면입니다</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">로그인, 회원가입 후 이용해주세요</p>
                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">로그인하면 전체 이모티콘 미리보기를 확인할 수 있습니다.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 푸터 - 고정 */}
      {detail && (
        <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 border-t border-black/5 dark:border-white/10 ${isMobile ? 'mb-10' : ''}`}>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
            <p className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} leading-tight text-gray-400 dark:text-gray-500`}>
              부적절하거나 저작권을 위반한 이모티콘은 별도 통보 없이 판매중지될 수 있습니다.
            </p>
            <button type="button" className="text-[11px] text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-left transition-colors w-fit">
              신고
            </button>
          </div>
          <div className="flex-shrink-0">
            {isOwned ? (
              <span className="flex items-center gap-1 text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                <Check className="w-4 h-4" />보유중
              </span>
            ) : isGuestPurchase ? (
              <a
                href={guestLoginHref}
                className="inline-flex items-center justify-center px-4 h-9 rounded-lg text-[13px] font-medium bg-brand-primary dark:bg-brand-primary-dark text-white hover:bg-brand-hover dark:hover:bg-brand-hover-dark transition-colors"
              >
                로그인하기
              </a>
            ) : (
              <button type="button" onClick={handlePurchaseClick}
                className="px-4 h-9 rounded-lg text-[13px] font-medium bg-brand-primary dark:bg-brand-primary-dark text-white hover:bg-brand-hover dark:hover:bg-brand-hover-dark transition-colors">
                {detail.isFree ? '무료 받기' : '구매하기'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

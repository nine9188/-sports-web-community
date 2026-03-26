'use client';

import Link from 'next/link';
import type { DealInfo } from '../../types/hotdeal';
import { formatPrice, formatShipping, getDiscountRate } from '../../utils/hotdeal';
import { HotdealEndButton } from './HotdealEndButton';

interface HotdealInfoBoxProps {
  dealInfo: DealInfo;
  postId: string;
  isAuthor: boolean;
}

/**
 * 핫딜 정보 박스 컴포넌트
 * 상세페이지에서 링크/쇼핑몰/상품명/가격/배송 정보를 테이블 형태로 표시
 */
export function HotdealInfoBox({ dealInfo, postId, isAuthor }: HotdealInfoBoxProps) {
  const discountRate = getDiscountRate(dealInfo.price, dealInfo.original_price);
  const isEnded = dealInfo.is_ended;

  return (
    <div className="rounded-lg border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] overflow-hidden">
      {/* 종료 상태 또는 종료 버튼 */}
      {isEnded ? (
        <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-[13px] px-3 py-1 rounded bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 font-medium">
              🔴 종료됨
            </span>
            <span className="text-[13px] text-gray-500 dark:text-gray-400">
              사유: {dealInfo.ended_reason || '알 수 없음'}
            </span>
            {dealInfo.ended_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(dealInfo.ended_at).toLocaleString('ko-KR')}
              </span>
            )}
          </div>
        </div>
      ) : (
        isAuthor && (
          <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <span className="text-[13px] text-gray-700 dark:text-gray-300">
              품절, 마감 등의 사유로 핫딜이 종료되었나요?
            </span>
            <HotdealEndButton postId={postId} />
          </div>
        )
      )}

      <div className="divide-y divide-black/5 dark:divide-white/10">
        {/* 링크 */}
        <div className="flex">
          <div className="w-24 flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            링크
          </div>
          <div className="flex-1 px-4 py-3">
            <Link
              href={dealInfo.deal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline break-all text-[13px] transition-colors"
            >
              {dealInfo.deal_url}
            </Link>
          </div>
        </div>

        {/* 쇼핑몰 */}
        <div className="flex">
          <div className="w-24 flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            쇼핑몰
          </div>
          <div className="flex-1 px-4 py-3 text-[13px] text-gray-900 dark:text-[#F0F0F0]">
            {dealInfo.store}
          </div>
        </div>

        {/* 상품명 */}
        <div className="flex">
          <div className="w-24 flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            상품명
          </div>
          <div className="flex-1 px-4 py-3 text-[13px] text-gray-900 dark:text-[#F0F0F0]">
            {dealInfo.product_name}
          </div>
        </div>

        {/* 가격 */}
        <div className="flex">
          <div className="w-24 flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            가격
          </div>
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* 정가가 있으면 할인 표시 */}
              {dealInfo.original_price && discountRate && (
                <>
                  <span className="text-[13px] text-gray-400 dark:text-gray-500 line-through">
                    {formatPrice(dealInfo.original_price)}
                  </span>
                  <span className="text-[13px] font-bold text-orange-600 dark:text-orange-400">
                    {discountRate}%↓
                  </span>
                </>
              )}
              <span className="text-[13px] font-bold text-red-600 dark:text-red-400">
                {formatPrice(dealInfo.price)}
              </span>
            </div>
          </div>
        </div>

        {/* 배송 */}
        <div className="flex">
          <div className="w-24 flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] px-4 py-3 text-[13px] font-medium text-gray-500 dark:text-gray-400">
            배송
          </div>
          <div className="flex-1 px-4 py-3">
            <span
              className={`text-[13px] ${
                dealInfo.shipping === '무료' || dealInfo.shipping === '무배'
                  ? 'text-green-600 dark:text-green-400 font-medium'
                  : 'text-gray-900 dark:text-[#F0F0F0]'
              }`}
            >
              {formatShipping(dealInfo.shipping)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
  DialogFooter,
} from '@/shared/components/ui'
import { useEmoticonInvalidation, useEmoticonShopData } from '@/domains/boards/hooks/useEmoticonQueries'
import EmoticonPackDetailContent from '@/domains/boards/components/post/emoticon/EmoticonPackDetailContent'
import type { EmoticonPackInfo } from '@/domains/boards/actions/emoticons'

interface EmoticonPackDetailModalProps {
  packId: string
  isOpen: boolean
  onClose: () => void
  userPoints: number
  userId?: string
  onPurchaseComplete: (shopItemId: number) => void
}

export default function EmoticonPackDetailModal({
  packId,
  isOpen,
  onClose,
  userId,
  onPurchaseComplete,
}: EmoticonPackDetailModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { data: shopData } = useEmoticonShopData()
  const { invalidateAfterPurchase } = useEmoticonInvalidation()
  const [purchasePack, setPurchasePack] = useState<EmoticonPackInfo | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const userPoints = shopData?.userPoints ?? 0
  const canAfford = (purchasePack?.price ?? 0) <= userPoints

  const handlePurchaseConfirm = async () => {
    if (!purchasePack?.shop_item_id || !userId) return
    try {
      setIsPurchasing(true)
      const { purchaseItem } = await import('@/domains/shop/actions/actions')
      await purchaseItem(purchasePack.shop_item_id)
      toast.success(`${purchasePack.pack_name} 팩을 구매했습니다!`)
      invalidateAfterPurchase(purchasePack.pack_id)
      onPurchaseComplete(purchasePack.shop_item_id)
      setPurchasePack(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '구매에 실패했습니다.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handlePurchaseClick = (pack: EmoticonPackInfo) => {
    if (!userId) { toast.error('로그인이 필요합니다.'); return; }
    setPurchasePack(pack)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          variant="bottomSheet"
          size="wide"
          className="flex flex-col h-[85vh] md:h-[566px] md:min-h-0 md:w-[min(692px,calc(100vw-2rem))]"
        >
          {/* 툴바 */}
          <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
            <DialogTitle className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
              팩 상세
            </DialogTitle>
            <DialogCloseButton className="flex-shrink-0" />
          </div>

          {/* 공통 콘텐츠 */}
          <EmoticonPackDetailContent
            packId={isOpen ? packId : ''}
            isMobile={!isDesktop}
            onPurchaseClick={handlePurchaseClick}
            className="flex-1 min-h-0"
          />
        </DialogContent>
      </Dialog>

      {/* 구매 확인 모달 */}
      {purchasePack && (
        <Dialog open={!!purchasePack} onOpenChange={(open) => !open && setPurchasePack(null)}>
          <DialogContent variant="bottomSheet" className="grid grid-rows-[auto,1fr,auto] min-h-[50vh] md:h-auto md:max-h-[80vh]">
            <div className="flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
              <DialogTitle className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">구매 확인</DialogTitle>
              <DialogCloseButton />
            </div>

            <DialogBody className="px-4 py-4 overflow-y-auto min-h-0">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] mb-4">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1D1D1D] flex items-center justify-center flex-shrink-0">
                  <Image src={purchasePack.pack_thumbnail} alt={purchasePack.pack_name} width={32} height={32} className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">{purchasePack.pack_name} 팩</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{purchasePack.emoticon_count}개 이모티콘</p>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-gray-900 dark:text-[#F0F0F0] flex-shrink-0">
                  {(purchasePack.price || 0).toLocaleString()} P
                </span>
              </div>

              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-700 dark:text-gray-300">보유 포인트</span>
                  <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()} P</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-700 dark:text-gray-300">가격</span>
                  <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">- {(purchasePack.price || 0).toLocaleString()} P</span>
                </div>
                <div className="border-t border-black/5 dark:border-white/10 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                      {canAfford ? '남는 포인트' : '부족한 포인트'}
                    </span>
                    <span className={`text-base font-bold tabular-nums ${canAfford ? 'text-gray-900 dark:text-[#F0F0F0]' : 'text-red-600 dark:text-red-400'}`}>
                      {Math.abs(userPoints - (purchasePack.price || 0)).toLocaleString()} P
                    </span>
                  </div>
                </div>
              </div>
              {!canAfford && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">포인트가 부족합니다.</p>
              )}
            </DialogBody>

            <DialogFooter className="flex-row gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setPurchasePack(null)}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handlePurchaseConfirm}
                disabled={!canAfford || isPurchasing}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPurchasing ? '처리 중...' : '구매하기'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

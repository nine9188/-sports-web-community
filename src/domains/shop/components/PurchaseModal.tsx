'use client'

import Image from 'next/image'
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage'
import { ImageType } from '@/shared/types/image'
import { ShopItem } from '../types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
  DialogFooter,
} from '@/shared/components/ui'

// API-Sports URL 유틸리티 함수들
function isApiSportsUrl(url: string): boolean {
  return Boolean(url && url.includes('media.api-sports.io'));
}

function getImageTypeFromUrl(url: string): ImageType | null {
  if (url.includes('/players/')) return ImageType.Players;
  if (url.includes('/teams/')) return ImageType.Teams;
  if (url.includes('/leagues/')) return ImageType.Leagues;
  if (url.includes('/coachs/')) return ImageType.Coachs;
  return null;
}

function getImageIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(players|teams|leagues|coachs|venues)\/(\d+)\.(png|gif)$/);
  return match ? match[2] : null;
}

interface PurchaseModalProps {
  item: ShopItem
  isProcessing: boolean
  canAfford: boolean
  userPoints: number
  isLoggedIn?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function PurchaseModal({
  item,
  isProcessing,
  canAfford,
  userPoints,
  isLoggedIn = true,
  onCancel,
  onConfirm
}: PurchaseModalProps) {
  const remainingPoints = Math.max(userPoints - item.price, 0)
  const lackingPoints = Math.max(item.price - userPoints, 0)
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent variant="bottomSheet" className="grid grid-rows-[auto,1fr,auto] min-h-[50vh] md:min-h-fit md:h-auto">
        <DialogHeader>
          <DialogTitle>구매 확인</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="px-4 md:px-6 py-4 overflow-y-auto">

          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 relative flex-shrink-0">
              {isApiSportsUrl(item.image_url) ? (
                <UnifiedSportsImage
                  imageId={getImageIdFromUrl(item.image_url) as string}
                  imageType={getImageTypeFromUrl(item.image_url) as ImageType}
                  alt={item.name}
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              ) : (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={20}
                  height={20}
                  className="w-full h-full object-contain dark:invert"
                />
              )}
            </div>
            
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{item.name}</p>
              <p className="text-xs tabular-nums text-gray-700 dark:text-gray-300">{item.price} 포인트</p>
            </div>
          </div>

          {/* 포인트 계산 - 로그인 시만 표시 */}
          {isLoggedIn && (
            <div className="space-y-4 mb-4 mt-4 md:mb-2 md:mt-2">
              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">보유한 내 포인트</span>
                  <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">
                    {userPoints.toLocaleString()} P
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300">상품 가격</span>
                  <span className="text-base font-semibold tabular-nums text-gray-900 dark:text-[#F0F0F0]">
                    - {item.price.toLocaleString()} P
                  </span>
                </div>
                
                <div className="border-t border-black/5 dark:border-white/10 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{canAfford ? '남는 포인트' : '부족한 포인트'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold tabular-nums ${canAfford ? 'text-gray-900 dark:text-[#F0F0F0]' : 'text-red-600 dark:text-red-400'}`}>
                        {(canAfford ? remainingPoints : lackingPoints).toLocaleString()} P
                      </span>
                      {!canAfford && (
                        <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">부족</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 비로그인 상태 안내 */}
          {!isLoggedIn && (
            <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg mb-4 mt-4 md:mb-2 md:mt-2 text-center border border-black/7 dark:border-0">
              <div className="mb-2">
                <svg className="w-8 h-8 mx-auto text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1 text-gray-900 dark:text-[#F0F0F0]">회원을 위한 구매 화면입니다</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">로그인, 회원가입 후 이용해주세요</p>
            </div>
          )}

        </DialogBody>

        <DialogFooter className="flex-col gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isLoggedIn ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 w-full">
              <p className="font-medium text-gray-900 dark:text-[#F0F0F0]">이 아이템을 구매하시겠습니까?</p>
              <p className="mt-1">구매 후에는 환불이 불가능합니다.</p>
            </div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center w-full">
              <p className="font-medium text-gray-900 dark:text-[#F0F0F0]">회원만 구매가 가능합니다</p>
              <p className="mt-1">로그인 후 이용해주세요</p>
            </div>
          )}
          {isLoggedIn ? (
            <Button
              onClick={onConfirm}
              variant="primary"
              className="w-full h-12 px-3 text-base rounded-lg active:scale-[0.98] transition"
              disabled={isProcessing || !canAfford}
            >
              {isProcessing ? '처리 중...' : '구매하기'}
            </Button>
          ) : (
            <a
              href="/signin"
              className="w-full h-12 px-3 text-base bg-[#262626] dark:bg-[#3F3F3F] text-white rounded-lg hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-[0.98] transition text-center inline-flex items-center justify-center"
              aria-label="로그인하기"
            >
              로그인하기
            </a>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
'use client'

import Image from 'next/image'
import { ShopItem } from '../types'

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Sheet / Dialog */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-lg shadow-xl grid grid-rows-[auto,1fr,auto] min-h-[50vh] max-h-[70vh] md:min-h-fit md:max-h-fit md:h-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b relative">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />
          <h2 id="purchase-title" className="text-base md:text-lg font-bold text-center md:text-left">구매 확인</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="absolute right-4 top-4 md:right-6 md:top-6 h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 md:px-6 py-4 md:py-4 overflow-y-auto">

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 relative flex-shrink-0">
              <Image 
                src={item.image_url} 
                alt={item.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs tabular-nums">{item.price} 포인트</p>
            </div>
          </div>

          {/* 포인트 계산 - 로그인 시만 표시 */}
          {isLoggedIn && (
            <div className="space-y-4 mb-4 mt-4 md:mb-2 md:mt-2">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">보유한 내 포인트</span>
                  <span className="text-base font-semibold tabular-nums">
                    {userPoints.toLocaleString()} P
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">상품 가격</span>
                  <span className="text-base font-semibold tabular-nums text-red-600">
                    - {item.price.toLocaleString()} P
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{canAfford ? '남는 포인트' : '부족한 포인트'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold tabular-nums ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                        {(canAfford ? remainingPoints : lackingPoints).toLocaleString()} P
                      </span>
                      {!canAfford && (
                        <span className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">부족</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 비로그인 상태 안내 */}
          {!isLoggedIn && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4 mt-4 md:mb-2 md:mt-2 text-center">
              <div className="mb-2">
                <svg className="w-8 h-8 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1">회원을 위한 구매 화면입니다</p>
              <p className="text-xs">로그인, 회원가입 후 이용해주세요</p>
            </div>
          )}

        </div>

        {/* Footer: Bottom sheet style with context-aware CTA */}
        <div className="p-4 md:p-6 border-t flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
          {isLoggedIn ? (
            <div className="text-sm text-gray-700 mb-3">
              <p className="font-medium">이 아이템을 구매하시겠습니까?</p>
              <p className="mt-1">구매 후에는 환불이 불가능합니다.</p>
            </div>
          ) : (
            <div className="text-sm text-gray-700 mb-3 text-center">
              <p className="font-medium">회원만 구매가 가능합니다</p>
              <p className="mt-1">로그인 후 이용해주세요</p>
            </div>
          )}
          {isLoggedIn ? (
            <button
              onClick={onConfirm}
              className="w-full h-12 px-3 text-base bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 active:scale-[0.98] transition mb-3 md:mb-2"
              disabled={isProcessing || !canAfford}
            >
              {isProcessing ? '처리 중...' : '구매하기'}
            </button>
          ) : (
            <a
              href="/signin"
              className="w-full h-12 px-3 text-base bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 active:scale-[0.98] transition mb-3 md:mb-2 text-center inline-flex items-center justify-center"
              aria-label="로그인하기"
            >
              로그인하기
            </a>
          )}
        </div>
      </div>
    </div>
  )
} 
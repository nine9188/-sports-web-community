'use client'

import Image from 'next/image'
import { ShopItem } from '../types'

interface PurchaseModalProps {
  item: ShopItem
  isProcessing: boolean
  canAfford: boolean
  userPoints: number
  onCancel: () => void
  onConfirm: () => void
}

export default function PurchaseModal({
  item,
  isProcessing,
  canAfford,
  userPoints,
  onCancel,
  onConfirm
}: PurchaseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-4">구매 확인</h2>
        
        {/* 보유 포인트 표시 */}
        <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-md">
          <span className="text-xs text-gray-500">보유 포인트</span>
          <span className="text-sm font-medium">{userPoints} P</span>
        </div>
        
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
            <p className="text-xs">{item.price} 포인트</p>
          </div>
        </div>
        
        {!canAfford ? (
          <div className="bg-red-50 text-red-700 p-2 rounded-md mb-4 text-xs">
            포인트가 부족합니다. 포인트를 충전한 후 다시 시도해주세요.
          </div>
        ) : (
          <div className="text-xs text-gray-600 mb-4">
            <p>이 아이템을 구매하시겠습니까?</p>
            <p className="mt-1">구매 후에는 환불이 불가능합니다.</p>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isProcessing}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isProcessing || !canAfford}
          >
            {isProcessing ? '처리 중...' : '구매하기'}
          </button>
        </div>
      </div>
    </div>
  )
} 
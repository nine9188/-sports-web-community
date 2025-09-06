'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import { ShopItem } from '../types'

interface ItemCardProps {
  item: ShopItem
  isOwned: boolean
  onPurchase: () => void
}

export default function ItemCard({ item, isOwned, onPurchase }: ItemCardProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* 이미지 영역: 고정 높이, 가운데 정렬, object-contain */}
      <div className="p-2 flex justify-center">
        <div className="h-16 w-full flex items-center justify-center">
          <Image 
            src={item.image_url} 
            alt={item.name}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="p-3 border-t mt-auto">
        <h3 className="text-sm font-medium truncate text-center" title={item.name}>{item.name}</h3>
        <div className="mt-2">
          {/* 배지/가격 슬롯: 고정 높이, 배지는 invisible로 자리 예약 */}
          <div className="flex items-center gap-2 h-5">
            <span className={`text-xs px-2 py-0.5 bg-gray-100 rounded whitespace-nowrap ${isOwned ? '' : 'invisible'}`}>보유 중</span>
            <span className="text-xs whitespace-nowrap ml-auto tabular-nums">
              {item.is_default ? '기본' : `${item.price} P`}
            </span>
          </div>
          {/* 버튼 슬롯: 모바일 풀폭, md+ 우측 정렬, 버튼 없어도 높이 유지 */}
          <div className="mt-2 md:flex md:justify-end h-9 md:h-7 md:items-center">
            {!isOwned && (
              <button
                onClick={() => startTransition(() => onPurchase())}
                className={`w-full md:w-auto h-9 md:h-7 px-3 text-xs rounded whitespace-nowrap text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 transition-colors ${
                  isPending
                    ? 'bg-gray-300 text-gray-800 cursor-wait'
                    : item.is_default
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                disabled={isPending || !!item.is_default}
                aria-busy={isPending}
                aria-live="polite"
              >
                {item.is_default ? '기본' : isPending ? '구매중…' : '구매'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
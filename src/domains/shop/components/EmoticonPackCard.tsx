'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import type { EmoticonPackInfo } from '@/domains/boards/actions/emoticons'

interface EmoticonPackCardProps {
  pack: EmoticonPackInfo
  isOwned: boolean
  onClick: () => void
}

export default function EmoticonPackCard({ pack, isOwned, onClick }: EmoticonPackCardProps) {
  const isFree = !pack.shop_item_id || pack.price === 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center p-2.5 sm:p-3 rounded-md border border-black/7 dark:border-0 bg-white dark:bg-[#1D1D1D] shadow-sm hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-all group"
    >
      {/* 썸네일 */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center mb-2">
        <Image
          src={pack.pack_thumbnail}
          alt={pack.pack_name}
          width={60}
          height={60}
          className="w-[60px] h-[60px] object-contain group-hover:scale-105 transition-transform"
        />
      </div>

      {/* 팩 이름 */}
      <p className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate w-full text-center leading-tight">
        {pack.pack_name}
      </p>

      {/* 이모티콘 수 */}
      <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {pack.emoticon_count}개
      </p>

      {/* 상태 뱃지 */}
      <div className="mt-1.5">
        {isOwned ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
            <Check className="w-3 h-3" />
            보유중
          </span>
        ) : isFree ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20">
            무료
          </span>
        ) : (
          <span className="text-xs sm:text-[13px] tabular-nums font-semibold text-gray-900 dark:text-[#F0F0F0]">
            {pack.price?.toLocaleString()} P
          </span>
        )}
      </div>
    </button>
  )
}

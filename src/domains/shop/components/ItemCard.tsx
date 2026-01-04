'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { ShopItem } from '../types'
import { getTeamDisplayName, searchTeamsByName } from '@teams'
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage'
import { ImageType } from '@/shared/types/image'

interface ItemCardProps {
  item: ShopItem
  isOwned: boolean
  onPurchase: () => void
}

export default function ItemCard({ item, isOwned, onPurchase }: ItemCardProps) {
  const [isPending, startTransition] = useTransition()
  
  // API-Sports 팀 ID 추출 (URL에서 팀 ID 파싱)
  const getTeamId = (imageUrl: string): string => {
    const match = imageUrl.match(/\/teams\/(\d+)\.png/)
    return match ? match[1] : '0'
  }

  const teamIdNum = Number(getTeamId(item.image_url))

  // DB 이름에서 접두사/영문명 추출
  const parseNameWithPrefix = (dbName: string): { prefix?: string; english?: string; hasPlusSeparator: boolean } => {
    if (!dbName) return { hasPlusSeparator: false }
    const plusIndex = dbName.indexOf('+')
    if (plusIndex !== -1) {
      return {
        prefix: dbName.slice(0, plusIndex).trim(),
        english: dbName.slice(plusIndex + 1).trim(),
        hasPlusSeparator: true
      }
    }
    const m = dbName.match(/^([가-힣0-9]+)\s+(.+)$/)
    if (m) {
      return { prefix: m[1].trim(), english: m[2].trim(), hasPlusSeparator: false }
    }
    return { hasPlusSeparator: false }
  }

  const { prefix, english, hasPlusSeparator } = parseNameWithPrefix(item.name)

  // 영어명만 한글 매핑 (우선순위: 팀 ID → 이름 검색)
  const mappedKoName = teamIdNum > 0
    ? getTeamDisplayName(teamIdNum, { language: 'ko' })
    : (english ? (searchTeamsByName(english)[0]?.name_ko ?? undefined) : undefined)

  const displayName = prefix
    ? `${prefix}${hasPlusSeparator ? ' + ' : ' '}${mappedKoName ?? english ?? item.name}`
    : (teamIdNum > 0 ? getTeamDisplayName(teamIdNum, { language: 'ko' }) : item.name)

  const isDisabled = isPending || !!item.is_default || isOwned

  // 테두리 색상 클래스 (티어 구분 없이 통일)
  const borderClass = 'border-black/7 dark:border-0'

  const handleActivate = () => {
    if (isDisabled) return
    startTransition(() => onPurchase())
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (isDisabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      startTransition(() => onPurchase())
    }
  }

  return (
    <div
      tabIndex={isDisabled ? -1 : 0}
      role="button"
      aria-disabled={isDisabled}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`group border ${borderClass} rounded-md overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-sm transition-all flex flex-col outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
        isDisabled ? 'cursor-default' : 'cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
      }`}
    >
      {/* 이미지 영역: 20x20 고정 */}
      <div className="p-3 flex justify-center bg-[#F5F5F5] dark:bg-[#262626]">
        <div className="h-5 w-5 flex items-center justify-center">
          {teamIdNum > 0 ? (
            <UnifiedSportsImage
              imageId={getTeamId(item.image_url)}
              imageType={ImageType.Teams}
              alt={displayName}
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          ) : (
            <Image
              src={item.image_url}
              alt={displayName}
              width={20}
              height={20}
              className="w-full h-full object-contain dark:invert"
            />
          )}
        </div>
      </div>
      
      {/* 구분선 */}
      <div className="border-t border-black/7 dark:border-white/10" />
      
      <div className="p-3 mt-auto">
        {/* 제목: 두 줄 허용, 폰트 한 단계 축소 */}
        <h3 className="text-[13px] font-medium text-center leading-5 line-clamp-2 min-h-[40px] text-gray-900 dark:text-[#F0F0F0] transition-colors" title={displayName}>{displayName}</h3>

        {/* 가격/구매: 좌측 가격, 우측 구매 버튼 정렬 */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-300">
            {item.is_default ? '기본' : `${item.price} P`}
          </span>
          {isOwned ? (
            <span className="h-8 px-2 text-[11px] bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded whitespace-nowrap inline-flex items-center justify-center border border-black/7 dark:border-0">
              보유 중
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); startTransition(() => onPurchase()) }}
              className={`h-8 px-2 text-[12px] font-medium rounded whitespace-nowrap text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors ${
                isPending
                  ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 cursor-wait'
                  : item.is_default
                    ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
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
  )
} 
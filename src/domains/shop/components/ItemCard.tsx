'use client'

import { useTransition } from 'react'
import { ShopItem } from '../types'
import { getTeamDisplayName, searchTeamsByName } from '@teams'
import ApiSportsImage from '@/shared/components/ApiSportsImage'
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

  // 컴팩트 스타일 클래스 세트 (상위에서 data-compact로 제어 가능)
  const cardPadding = 'p-3'
  const bodyPadding = 'p-3'

  const isDisabled = isPending || !!item.is_default || isOwned

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
      className={`group border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
        isDisabled ? 'cursor-default' : 'cursor-pointer hover:border-blue-300'
      }`}
    >
      {/* 이미지 영역: 20x20 고정 */}
      <div className={`${cardPadding} sm:p-3 p-2 flex justify-center`}> 
        <div className="h-5 w-5 flex items-center justify-center">
          <ApiSportsImage
            imageId={getTeamId(item.image_url)}
            imageType={ImageType.Teams}
            alt={displayName}
            width={20}
            height={20}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className={`${bodyPadding} sm:p-3 p-2 border-t mt-auto`}>
        {/* 제목: 두 줄 허용, 폰트 한 단계 축소 (모바일 더 축소) */}
        <h3 className="sm:text-[13px] text-[12px] font-medium text-center leading-5 line-clamp-2 min-h-[36px] sm:min-h-[40px] text-gray-900 group-hover:text-blue-600 transition-colors" title={displayName}>{displayName}</h3>

        {/* 가격/구매: 좌측 가격, 우측 구매 버튼 정렬 */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
          <div className="flex items-center h-5">
            <span className="sm:text-[11px] text-[10px] whitespace-nowrap tabular-nums">
              {item.is_default ? '기본' : `${item.price} P`}
            </span>
          </div>
          <div className="flex items-center">
            {isOwned ? (
              <span className="h-7 sm:h-8 px-2 sm:text-[11px] text-[10px] bg-gray-600 text-white rounded whitespace-nowrap inline-flex items-center justify-center">
                보유 중
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); startTransition(() => onPurchase()) }}
                className={`h-7 sm:h-8 px-2 text-[11px] sm:text-[12px] font-medium rounded whitespace-nowrap text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300 transition-colors ${
                  isPending
                    ? 'bg-gray-300 text-gray-900 cursor-wait'
                    : item.is_default
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-blue-700 focus-visible:text-blue-700 group-hover:text-blue-700'
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
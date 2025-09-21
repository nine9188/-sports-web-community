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

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* 이미지 영역: 고정 크기, 가운데 정렬, 균일한 크기 */}
      <div className="p-3 flex justify-center">
        <div className="h-12 w-12 flex items-center justify-center">
          <ApiSportsImage
            imageId={getTeamId(item.image_url)}
            imageType={ImageType.Teams}
            alt={displayName}
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div className="p-3 border-t mt-auto">
        <h3 className="text-sm font-medium truncate text-center" title={displayName}>{displayName}</h3>
        <div className="mt-2">
          {/* 가격 슬롯 */}
          <div className="flex items-center justify-center h-5">
            <span className="text-xs whitespace-nowrap tabular-nums">
              {item.is_default ? '기본' : `${item.price} P`}
            </span>
          </div>
          {/* 버튼/배지 슬롯: 모바일 풀폭, md+ 우측 정렬, 버튼 없어도 높이 유지 */}
          <div className="mt-2 md:flex md:justify-end h-9 md:h-7 md:items-center">
            {isOwned ? (
              <span className="w-full md:w-auto h-9 md:h-7 px-3 text-xs bg-gray-600 text-white rounded whitespace-nowrap text-center flex items-center justify-center">
                보유 중
              </span>
            ) : (
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
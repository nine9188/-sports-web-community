'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { Button, Container, ContainerContent, Pagination } from '@/shared/components/ui'
import { type EmoticonPackInfo } from '@/domains/boards/actions/emoticons'
import { useEmoticonShopData } from '@/domains/boards/hooks/useEmoticonQueries'
import EmoticonPackCard from './EmoticonPackCard'
import EmoticonPackDetailModal from './EmoticonPackDetailModal'

const PAGE_SIZE = 15

type SubFilter = 'all' | 'free' | 'paid'

const SUB_FILTER_TABS: { key: SubFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'free', label: '무료' },
  { key: 'paid', label: '유료' },
]

interface EmoticonShopSectionProps {
  userId?: string
  userItems: number[]
  userPoints: number
}

export default function EmoticonShopSection({
  userId,
}: EmoticonShopSectionProps) {
  const { data: shopData, isLoading } = useEmoticonShopData()
  const [subFilter, setSubFilter] = useState<SubFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const packs = shopData?.packs ?? []
  const ownedItemIds = shopData?.ownedItemIds ?? []
  const userPoints = shopData?.userPoints ?? 0

  const isOwned = (pack: EmoticonPackInfo) => {
    if (!pack.shop_item_id) return true
    return ownedItemIds.includes(pack.shop_item_id)
  }

  const filteredPacks = useMemo(() => {
    let result = packs
    // 검색
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(p => p.pack_name.toLowerCase().includes(q))
    }
    // 서브필터
    switch (subFilter) {
      case 'free': return result.filter(p => !p.shop_item_id || p.price === 0)
      case 'paid': return result.filter(p => p.shop_item_id && (p.price ?? 0) > 0)
      default: return result
    }
  }, [packs, subFilter, query])

  const totalPages = Math.ceil(filteredPacks.length / PAGE_SIZE)
  const paginatedPacks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredPacks.slice(start, start + PAGE_SIZE)
  }, [filteredPacks, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [subFilter, query])

  if (isLoading) {
    return <div className="py-16" />
  }

  return (
    <div className="space-y-4">
      {/* 이모티콘 스튜디오 링크 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="px-4 py-3">
          <Link
            href="/shop/emoticon-studio"
            className="flex items-center justify-center text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors"
          >
            이모티콘 스튜디오 →
          </Link>
        </ContainerContent>
      </Container>

      {/* 필터 + 검색 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="px-4 py-2.5">
          <nav className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-shrink-0">
              {SUB_FILTER_TABS.map(tab => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  onClick={() => setSubFilter(tab.key)}
                  className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 ${
                    subFilter === tab.key ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <div className="relative flex-1 max-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="이모티콘 팩 검색..."
                className="w-full pl-9 pr-8 py-1 text-[13px] bg-transparent text-gray-900 dark:text-[#F0F0F0] rounded-lg placeholder-gray-500 outline-none focus:outline-none hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </nav>
        </ContainerContent>
      </Container>

      {/* 검색 결과 안내 */}
      {query.trim() && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          '{query}' 검색 결과 {filteredPacks.length}개
        </p>
      )}

      {paginatedPacks.length === 0 ? (
        <div className="text-center py-10 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            {query.trim() ? `'${query}' 검색 결과가 없습니다.` : subFilter === 'free' ? '무료 팩이 없습니다.' : subFilter === 'paid' ? '유료 팩이 없습니다.' : '이모티콘 팩이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {paginatedPacks.map(pack => (
            <EmoticonPackCard
              key={pack.pack_id}
              pack={pack}
              isOwned={isOwned(pack)}
              onClick={() => setSelectedPackId(pack.pack_id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          mode="button"
          withMargin={false}
        />
      )}

      {selectedPackId && (
        <EmoticonPackDetailModal
          packId={selectedPackId}
          isOpen={!!selectedPackId}
          onClose={() => setSelectedPackId(null)}
          userPoints={userPoints}
          userId={userId}
          onPurchaseComplete={() => {}}
        />
      )}
    </div>
  )
}

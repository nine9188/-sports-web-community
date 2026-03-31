'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { ShopItem } from '../types'
import ItemGrid from '@/domains/shop/components/ItemGrid'
import EmoticonShopSection from '@/domains/shop/components/EmoticonShopSection'
import { Button, Container, ContainerContent, Pagination, TabList } from '@/shared/components/ui'
import AdBanner from '@/shared/components/AdBanner'

const PAGE_SIZE = 30
const MAX_VISIBLE_MOBILE = 4

type ShopTab = 'icons' | 'emoticons' | 'special'

const SHOP_TABS = [
  { id: 'icons', label: '팀 아이콘' },
  { id: 'emoticons', label: '이모티콘' },
  { id: 'special', label: '특수 아이템' },
]

// 특수 아이템 카테고리 ID
const SPECIAL_ITEMS_CATEGORY_ID = 24

interface CategoryFilterProps {
  items: ShopItem[]
  userItems: number[]
  userPoints: number
  userId: string | undefined
  categories: {
    id: number
    name: string
    display_order?: number
    subcategories?: {
      id: number
      name: string
      display_order?: number
    }[]
  }[]
  loginNotice?: React.ReactNode
  initialActiveCategory?: string
  emoticonCategoryId?: number | null
}

export default function CategoryFilter({
  items,
  userItems,
  userPoints,
  userId,
  categories,
  loginNotice,
  initialActiveCategory,
  emoticonCategoryId
}: CategoryFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // 초기 탭 결정: URL 파라미터 기반
  const getInitialTab = (): ShopTab => {
    const cat = initialActiveCategory ?? searchParams.get('cat') ?? 'all'
    if (emoticonCategoryId != null && cat === String(emoticonCategoryId)) return 'emoticons'
    if (cat === String(SPECIAL_ITEMS_CATEGORY_ID)) return 'special'
    return 'icons'
  }

  const [activeTab, setActiveTab] = useState<ShopTab>(getInitialTab)
  const [activeCategory, setActiveCategory] = useState<string>(initialActiveCategory ?? (searchParams.get('cat') ?? 'all'))
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)

  // 모바일 체크
  useEffect(() => {
    let rafId: number | null = null
    const check = () => setIsMobile(window.innerWidth < 728)
    check()
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        check()
        setMobileDropdownOpen(false)
      })
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 카테고리 정렬
  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) => {
      if (a.display_order !== undefined && b.display_order !== undefined) {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order
        }
      }
      return a.name.localeCompare(b.name)
    }), [categories])

  // 탭별 카테고리 필터링 (팀 아이콘 탭에서만 카테고리 버튼 표시)
  const tabFilteredCategories = useMemo(() => {
    return sortedCategories.filter(cat => {
      if (emoticonCategoryId != null && cat.id === emoticonCategoryId) return false
      if (cat.id === SPECIAL_ITEMS_CATEGORY_ID) return false
      return true
    })
  }, [sortedCategories, emoticonCategoryId])

  // 모바일에서 보이는/숨겨진 카테고리 분리 (탭 필터링된 카테고리 사용)
  const { visibleCategories, hiddenCategories } = useMemo(() => {
    if (isMobile && tabFilteredCategories.length > MAX_VISIBLE_MOBILE) {
      return {
        visibleCategories: tabFilteredCategories.slice(0, MAX_VISIBLE_MOBILE),
        hiddenCategories: tabFilteredCategories.slice(MAX_VISIBLE_MOBILE),
      }
    }
    return { visibleCategories: tabFilteredCategories, hiddenCategories: [] as typeof tabFilteredCategories }
  }, [tabFilteredCategories, isMobile])

  const filteredItems = useMemo(() => {
    // 팀 아이콘 탭의 '전체'일 때: 이모티콘 + 특수 아이템 제외
    if (activeCategory === 'all') return items.filter(item => {
      if (emoticonCategoryId != null && item.category_id === emoticonCategoryId) return false
      if (item.category_id === SPECIAL_ITEMS_CATEGORY_ID) return false
      return true
    })
    const activeId = Number(activeCategory)
    if (Number.isNaN(activeId)) return items
    const parent = sortedCategories.find(cat => cat.id === activeId)
    const allowedIds = new Set<number>([activeId])
    if (parent?.subcategories && parent.subcategories.length > 0) {
      parent.subcategories.forEach(sub => allowedIds.add(sub.id))
    }
    return items.filter(item => item.category_id != null && allowedIds.has(item.category_id as number))
  }, [items, activeCategory, sortedCategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory])

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, currentPage])

  useEffect(() => {
    const catFromUrl = searchParams.get('cat') ?? 'all'
    if (catFromUrl !== activeCategory) {
      setActiveCategory(catFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const updateUrlCategory = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (next === 'all') {
      params.delete('cat')
    } else {
      params.set('cat', next)
    }
    const query = params.toString()
    const href = query ? `${pathname}?${query}` : pathname
    window.history.replaceState(null, '', href)
  }, [searchParams, pathname])

  const handleSelect = useCallback((id: string) => {
    setActiveCategory(id)
    updateUrlCategory(id)
  }, [updateUrlCategory])

  // 탭 전환 핸들러
  const handleTabChange = useCallback((tab: ShopTab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setMobileDropdownOpen(false)
    if (tab === 'emoticons' && emoticonCategoryId != null) {
      setActiveCategory(String(emoticonCategoryId))
      updateUrlCategory(String(emoticonCategoryId))
    } else if (tab === 'special') {
      setActiveCategory(String(SPECIAL_ITEMS_CATEGORY_ID))
      updateUrlCategory(String(SPECIAL_ITEMS_CATEGORY_ID))
    } else {
      setActiveCategory('all')
      updateUrlCategory('all')
    }
  }, [emoticonCategoryId, updateUrlCategory])

  // 현재 선택된 카테고리의 부모 찾기
  const expandedParentId = useMemo(() => {
    if (activeCategory === 'all') return null
    const activeId = Number(activeCategory)
    const parent = sortedCategories.find(cat => cat.id === activeId)
    if (parent?.subcategories && parent.subcategories.length > 0) return parent.id
    for (const cat of sortedCategories) {
      if (cat.subcategories?.some(sub => sub.id === activeId)) {
        return cat.id
      }
    }
    return null
  }, [activeCategory, sortedCategories])

  const renderCategoryButton = (category: typeof sortedCategories[0]) => (
    <Button
      key={category.id}
      onClick={() => handleSelect(category.id.toString())}
      variant="ghost"
      className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 ${
        activeCategory === category.id.toString() || expandedParentId === category.id
          ? 'bg-[#EAEAEA] dark:bg-[#333333]'
          : ''
      }`}
    >
      {category.name}
    </Button>
  )

  return (
    <div>
      {/* 상단 탭 (팀 아이콘 / 이모티콘 / 특수 아이템) */}
      <TabList
        tabs={SHOP_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => handleTabChange(tabId as ShopTab)}
        className="mb-4"
      />

      {/* 카테고리 필터 (팀 아이콘 탭에서만 표시) */}
      {activeTab === 'icons' && (
        <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
          <ContainerContent className="px-4 py-2.5">
            {/* 루트 카테고리 */}
            <nav className="flex items-center justify-between gap-2">
              {/* 전체 버튼 */}
              <Button
                onClick={() => handleSelect('all')}
                variant="ghost"
                className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 flex-shrink-0 ${
                  activeCategory === 'all' ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                전체
              </Button>

              {/* 카테고리 버튼들 */}
              <div className="flex items-center justify-between gap-1 flex-1">
                <div className="flex items-center gap-1 flex-1 flex-wrap">
                  {visibleCategories.map(renderCategoryButton)}
                </div>

                {/* 접기/펼치기 버튼 (숨겨진 카테고리가 있을 때만) */}
                {hiddenCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    className="h-auto w-auto px-2 py-1 text-gray-700 dark:text-gray-300 flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${mobileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                )}
              </div>
            </nav>

            {/* 숨겨진 카테고리 펼치기 */}
            {mobileDropdownOpen && hiddenCategories.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/7 dark:border-white/10">
                <div className="flex flex-wrap gap-1">
                  {hiddenCategories.map(renderCategoryButton)}
                </div>
              </div>
            )}

            {/* 서브카테고리 - 선택된 부모의 하위 카테고리 펼침 */}
            {expandedParentId && (() => {
              const parent = sortedCategories.find(cat => cat.id === expandedParentId)
              if (!parent?.subcategories || parent.subcategories.length === 0) return null
              const sortedSubs = [...parent.subcategories].sort((a, b) => {
                if (a.display_order !== undefined && b.display_order !== undefined) {
                  if (a.display_order !== b.display_order) return a.display_order - b.display_order
                }
                return a.name.localeCompare(b.name)
              })
              return (
                <nav className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/10">
                  <Button
                    onClick={() => handleSelect(expandedParentId.toString())}
                    variant="ghost"
                    className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 flex-shrink-0 ${
                      activeCategory === expandedParentId.toString() ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                    }`}
                  >
                    전체
                  </Button>
                  <div className="flex items-center gap-1 flex-1 flex-wrap">
                    {sortedSubs.map((sub) => (
                      <Button
                        key={sub.id}
                        onClick={() => handleSelect(sub.id.toString())}
                        variant="ghost"
                        className={`px-2 py-1 h-auto text-xs sm:text-[13px] whitespace-nowrap flex items-center gap-1 text-gray-700 dark:text-gray-300 ${
                          activeCategory === sub.id.toString() ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                        }`}
                      >
                        {sub.name}
                      </Button>
                    ))}
                  </div>
                </nav>
              )
            })()}
          </ContainerContent>
        </Container>
      )}

      {/* 로그인 안내 */}
      {loginNotice && (
        <div className="mb-3">
          {loginNotice}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="space-y-4">
        {activeTab === 'emoticons' ? (
          <EmoticonShopSection
            userId={userId}
            userItems={userItems}
            userPoints={userPoints}
          />
        ) : (
          <>
            <ItemGrid
              items={paginatedItems}
              userItems={userItems}
              userPoints={userPoints}
              userId={userId}
              viewMode={'compact'}
              isLoading={false}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                mode="button"
                withMargin={false}
              />
            )}
          </>
        )}
        <AdBanner />
      </div>
    </div>
  )
}

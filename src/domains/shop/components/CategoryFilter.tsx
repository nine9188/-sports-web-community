'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ShopItem } from '../types'
import ItemGrid from '@/domains/shop/components/ItemGrid'
import Tabs, { TabItem } from '@/shared/ui/tabs'

interface CategoryFilterProps {
  items: ShopItem[]
  userItems: number[]
  userPoints: number
  userId: string | undefined
  categories: {
    id: number
    name: string
  }[]
}

export default function CategoryFilter({ 
  items, 
  userItems, 
  userPoints, 
  userId, 
  categories 
}: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [hideOwned, setHideOwned] = useState<boolean>(false)
  
  const filteredItems = useMemo(() => {
    let filtered = items

    // 카테고리 필터
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id?.toString() === activeCategory)
    }

    // 검색 필터
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      )
    }

    // 보유 아이템 숨김 필터
    if (hideOwned) {
      filtered = filtered.filter(item => !userItems.includes(item.id))
    }

    return filtered
  }, [items, activeCategory, searchTerm, hideOwned, userItems])

  // 검색어 변경 핸들러
  useEffect(() => {
    const searchInput = document.getElementById('search') as HTMLInputElement
    
    if (searchInput) {
      const handleSearch = (e: Event) => {
        const target = e.target as HTMLInputElement
        setSearchTerm(target.value)
      }
      
      searchInput.addEventListener('input', handleSearch)
      return () => searchInput.removeEventListener('input', handleSearch)
    }
  }, [])

  // 보유 아이템 필터 변경 핸들러
  useEffect(() => {
    const hideOwnedCheckbox = document.getElementById('hideOwned') as HTMLInputElement
    
    if (hideOwnedCheckbox) {
      const handleHideOwned = (e: Event) => {
        const target = e.target as HTMLInputElement
        setHideOwned(target.checked)
      }
      
      hideOwnedCheckbox.addEventListener('change', handleHideOwned)
      return () => hideOwnedCheckbox.removeEventListener('change', handleHideOwned)
    }
  }, [])

  const tabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [{ id: 'all', label: '전체' }]
    const catTabs: TabItem[] = categories.map(c => ({ id: c.id.toString(), label: c.name }))
    return [...base, ...catTabs]
  }, [categories])

  const handleTabChange = useCallback((tabId: string) => {
    setActiveCategory(tabId)
  }, [])

  return (
    <div>
      <Tabs
        tabs={tabs}
        activeTab={activeCategory}
        onTabChange={handleTabChange}
      />

      {/* 검색 및 필터 옵션 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                id="search"
                placeholder="아이템 검색..."
                className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                <input 
                  type="checkbox" 
                  id="hideOwned"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                보유중 미표시
              </label>
            </div>
          </div>

          {/* 필터 결과 요약 - 항상 표시 */}
          <div className="mt-3 pt-3 border-t text-sm text-gray-600">
            {searchTerm.trim() ? (
              <span>&lsquo;{searchTerm}&rsquo; 검색 결과: </span>
            ) : (
              <span>전체 </span>
            )}
            <span className="font-semibold">{filteredItems.length}개 아이템</span>
            <span className="ml-2 text-blue-600">
              ({hideOwned ? '보유중 숨김' : '보유중 보임'})
            </span>
          </div>
        </div>
      </div>

      <ItemGrid
        items={filteredItems}
        userItems={userItems}
        userPoints={userPoints}
        userId={userId}
      />
    </div>
  )
} 
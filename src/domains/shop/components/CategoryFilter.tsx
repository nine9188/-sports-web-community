'use client'

import { useState, useMemo, useCallback } from 'react'
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
  
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    return items.filter(item => item.category_id?.toString() === activeCategory)
  }, [items, activeCategory])

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

      <ItemGrid
        items={filteredItems}
        userItems={userItems}
        userPoints={userPoints}
        userId={userId}
      />
    </div>
  )
} 
'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { ShopItem } from '../types'
import ItemGrid from '@/domains/shop/components/ItemGrid'

interface CategoryFilterProps {
  items: ShopItem[]
  userItems: number[]
  userPoints: number
  userId: string | undefined
  categories: {
    id: number
    name: string
    subcategories?: {
      id: number
      name: string
    }[]
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
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [bottomSheetCategory, setBottomSheetCategory] = useState<number | null>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<typeof categories>([])
  const [hiddenCategories, setHiddenCategories] = useState<typeof categories>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<Record<number, HTMLElement | null>>({})
  const bottomSheetRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ left: number }>({ left: 0 })
  
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    const activeId = Number(activeCategory)
    if (Number.isNaN(activeId)) return items
    const parent = categories.find(cat => cat.id === activeId)
    const allowedIds = new Set<number>([activeId])
    if (parent?.subcategories && parent.subcategories.length > 0) {
      parent.subcategories.forEach(sub => allowedIds.add(sub.id))
    }
    return items.filter(item => item.category_id != null && allowedIds.has(item.category_id as number))
  }, [items, activeCategory, categories])

  // 타이머 정리 함수
  const clearTimers = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }

  // 모바일 여부 감지 및 리사이즈 시 업데이트
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile, { passive: true })
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  // 상단 탭 표시 개수 제어 (모바일: 3개 + 더보기)
  useEffect(() => {
    const applyVisibility = () => {
      const mobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
      if (mobile) {
        const maxVisible = 3
        if (categories.length <= maxVisible) {
          setVisibleCategories(categories)
          setHiddenCategories([])
        } else {
          setVisibleCategories(categories.slice(0, maxVisible))
          setHiddenCategories(categories.slice(maxVisible))
        }
      } else {
        setVisibleCategories(categories)
        setHiddenCategories([])
        setMobileDropdownOpen(false)
      }
    }
    applyVisibility()
  }, [categories])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      if (!mobile) setMobileDropdownOpen(false)
      const maxVisible = 3
      if (mobile) {
        if (categories.length <= maxVisible) {
          setVisibleCategories(categories)
          setHiddenCategories([])
        } else {
          setVisibleCategories(categories.slice(0, maxVisible))
          setHiddenCategories(categories.slice(maxVisible))
        }
      } else {
        setVisibleCategories(categories)
        setHiddenCategories([])
      }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [categories])

  // 외부 클릭 시 닫기
  const handleOutsideClick = useCallback((event: MouseEvent) => {
    const target = event.target as Node
    // 컨테이너 내부 클릭은 무시
    if (containerRef.current?.contains(target)) return
    // 바텀시트 내부 클릭은 무시 (포털로 분리되어 있어 별도 예외 처리)
    if (bottomSheetRef.current?.contains(target)) return

    setHoveredCategory(null)
    setMobileDropdownOpen(false)
    setBottomSheetCategory(null)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick, { passive: true })
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [handleOutsideClick])

  // 모바일 바텀시트 열릴 때 body 스크롤 잠금/복원
  useEffect(() => {
    if (isMobile && bottomSheetCategory) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    } else {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
    }
  }, [isMobile, bottomSheetCategory])

  // 호버 시작 처리 - BoardNavigationClient와 동일한 패턴
  const handleMouseEnter = (categoryId: number, element: HTMLElement) => {
    if (isMobile) return
    clearTimers()
    
    const category = categories.find(cat => cat.id === categoryId)
    if (category?.subcategories && category.subcategories.length > 0) {
      requestAnimationFrame(() => {
        const rawLeft = (element as HTMLElement).offsetLeft || 0
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth
        const padding = 8
        const estimatedMenuWidth = 600 // matches max-w of panel
        const maxLeft = Math.max(0, containerWidth - estimatedMenuWidth - padding)
        const clampedLeft = Math.max(padding, Math.min(rawLeft, maxLeft))
        setMenuPosition({ left: clampedLeft })
        setHoveredCategory(categoryId)
      })
    }
  }

  // 호버 종료 처리
  const handleMouseLeave = () => {
    if (isMobile) return
    clearTimers()
    
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
    }, 250)
  }

  // 메뉴에 마우스 진입/이탈 (HoverMenu 스타일)
  // 현재 상단 패널은 nav 내부에 붙어 있어 트리거와의 이탈만 처리

  // 드롭다운 닫기
  const closeDropdown = () => {
    clearTimers()
    setHoveredCategory(null)
  }

  const hoveredCategoryData = hoveredCategory ? categories.find(cat => cat.id === hoveredCategory) : null
  const bottomSheetCategoryData = bottomSheetCategory ? categories.find(cat => cat.id === bottomSheetCategory) : null

  // 데스크탑: 패널 실제 너비 기반으로 좌측 위치 보정 (오버플로 방지)
  useEffect(() => {
    if (isMobile || !hoveredCategory) return
    const clampLeft = () => {
      if (!menuRef.current || !containerRef.current) return
      const containerWidth = containerRef.current.clientWidth
      const menuWidth = menuRef.current.offsetWidth
      const padding = 8
      const maxLeft = Math.max(0, containerWidth - menuWidth - padding)
      const clampedLeft = Math.max(padding, Math.min(menuPosition.left, maxLeft))
      if (clampedLeft !== menuPosition.left) {
        setMenuPosition({ left: clampedLeft })
      }
    }
    clampLeft()
    window.addEventListener('resize', clampLeft, { passive: true })
    return () => window.removeEventListener('resize', clampLeft)
  }, [hoveredCategory, isMobile, menuPosition.left])

  return (
    <div>
      {/* HoverMenu 스타일에 맞춘 탭 바 */}
      <div className="bg-white border rounded-lg mb-4">
        <div className="px-4 py-2 relative" ref={containerRef}>
          <nav className="flex items-center" ref={navRef}>
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                activeCategory === 'all'
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              전체
            </button>
            {visibleCategories.map(category => (
              <div
                key={category.id}
                className="relative"
                ref={(el) => { menuItemsRef.current[category.id] = el }}
                onMouseEnter={(e) => {
                  if (isMobile) return
                  handleMouseEnter(category.id, e.currentTarget)
                }}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => {
                    if (isMobile && category.subcategories && category.subcategories.length > 0) {
                      setBottomSheetCategory(category.id)
                    } else {
                      setActiveCategory(category.id.toString())
                    }
                  }}
                  className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                    activeCategory === category.id.toString()
                      ? 'bg-gray-100 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {category.name}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}

            {hiddenCategories.length > 0 && (
              <button
                onClick={() => setMobileDropdownOpen(prev => !prev)}
                className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md ml-2"
                aria-label="더보기"
                aria-expanded={mobileDropdownOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${
                    mobileDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </nav>

          {/* 숨겨진 카테고리들을 위한 드롭다운 메뉴 */}
          {mobileDropdownOpen && hiddenCategories.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex flex-wrap gap-1">
                {hiddenCategories.map((category) => (
                  <div
                    key={category.id}
                    className="relative"
                    ref={(el) => { menuItemsRef.current[category.id] = el }}
                    onMouseEnter={(e) => {
                      if (isMobile) return
                      handleMouseEnter(category.id, e.currentTarget)
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => {
                        if (category.subcategories && category.subcategories.length > 0) {
                          setBottomSheetCategory(category.id)
                        } else {
                          setActiveCategory(category.id.toString())
                        }
                        setMobileDropdownOpen(false)
                      }}
                      className={`px-2 py-1 text-sm font-medium whitespace-nowrap hover:bg-gray-50 rounded-md flex items-center ${
                        activeCategory === category.id.toString() ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {category.name}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 데스크톱: HoverMenu 스타일 패널 */}
          {!isMobile && hoveredCategory && hoveredCategoryData && hoveredCategoryData.subcategories && hoveredCategoryData.subcategories.length > 0 && (
            <div
              ref={menuRef}
              onMouseEnter={() => clearTimers()}
              onMouseLeave={handleMouseLeave}
              className="absolute bg-white shadow-md border rounded-b-lg z-40 p-3 top-[100%] max-w-[600px] min-w-[300px] -mt-1"
              style={{ left: `${menuPosition.left}px`, marginTop: '-7px' }}
            >
              {/* 4개씩 한 줄 구성 (긴 텍스트는 2줄까지 표시) */}
              <div className="grid gap-1 max-w-full">
                {Array.from({ length: Math.ceil(((hoveredCategoryData.subcategories ?? []).length) / 3) }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1 overflow-hidden">
                    {(hoveredCategoryData.subcategories ?? [])
                      .slice(rowIndex * 3, rowIndex * 3 + 3)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setActiveCategory(sub.id.toString())
                closeDropdown()
              }}
                          className={`inline-block px-3 py-2 text-sm hover:bg-gray-50 rounded-md whitespace-nowrap ${
                            activeCategory === sub.id.toString() ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 데스크톱 드롭다운 제거: HoverMenu 스타일 상단 패널로 대체됨 */}

      {/* 모바일: 바텀시트 - 하위 카테고리 */}
      {isMobile && bottomSheetCategory && bottomSheetCategoryData && ReactDOM.createPortal(
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setBottomSheetCategory(null)}
          />
          {/* 바텀시트 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg z-50" ref={bottomSheetRef}>
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {bottomSheetCategoryData.name}
              </h3>
              <button
                onClick={() => setBottomSheetCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            {/* 콘텐츠 */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (bottomSheetCategory == null) return
                    setActiveCategory(bottomSheetCategory.toString())
                    setBottomSheetCategory(null)
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 rounded-lg border border-gray-300 text-blue-600"
                >
                  전체 보기
                </button>
                {bottomSheetCategoryData.subcategories?.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveCategory(sub.id.toString())
                      setBottomSheetCategory(null)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg border ${
                      activeCategory === sub.id.toString()
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'border-gray-200'
              }`}
            >
              {sub.name}
            </button>
          ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      <ItemGrid
        items={filteredItems}
        userItems={userItems}
        userPoints={userPoints}
        userId={userId}
      />
    </div>
  )
} 
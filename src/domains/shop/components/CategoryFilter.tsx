'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import ReactDOM from 'react-dom'
import { ShopItem } from '../types'
import ItemGrid from '@/domains/shop/components/ItemGrid'
import { Button, Pagination } from '@/shared/components/ui'
import AdSense from '@/shared/components/AdSense'

const PAGE_SIZE = 30

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
}


export default function CategoryFilter({ 
  items, 
  userItems, 
  userPoints, 
  userId, 
  categories,
  loginNotice,
  initialActiveCategory
}: CategoryFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState<string>(initialActiveCategory ?? (searchParams.get('cat') ?? 'all'))
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  // 카테고리 정렬 - display_order 우선, 그 다음 이름순
  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => {
      if (a.display_order !== undefined && b.display_order !== undefined) {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order
        }
      }
      return a.name.localeCompare(b.name)
    }), [categories])
  
  const [currentPage, setCurrentPage] = useState(1)

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    const activeId = Number(activeCategory)
    if (Number.isNaN(activeId)) return items
    const parent = sortedCategories.find(cat => cat.id === activeId)
    const allowedIds = new Set<number>([activeId])
    if (parent?.subcategories && parent.subcategories.length > 0) {
      parent.subcategories.forEach(sub => allowedIds.add(sub.id))
    }
    return items.filter(item => item.category_id != null && allowedIds.has(item.category_id as number))
  }, [items, activeCategory, sortedCategories])

  // 카테고리 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory])

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, currentPage])

  // URL 변화에 따라 내부 상태 동기화 (뒤로가기 등)
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
    // 서버 재요청 없이 URL만 업데이트 (클라이언트 필터링)
    window.history.replaceState(null, '', href)
  }, [searchParams, pathname])

  // 초기 설정
  useEffect(() => {
    if (sortedCategories.length > 0) {
      const mobile = window.innerWidth < 768
      
      if (mobile) {
        const maxVisibleCategories = 3
        
        if (sortedCategories.length <= maxVisibleCategories) {
          setVisibleCategories(sortedCategories)
          setHiddenCategories([])
        } else {
          setVisibleCategories(sortedCategories.slice(0, maxVisibleCategories))
          setHiddenCategories(sortedCategories.slice(maxVisibleCategories))
        }
      } else {
        setVisibleCategories(sortedCategories)
        setHiddenCategories([])
      }
    }
  }, [sortedCategories])

  // 모바일 환경 체크 및 보이는/숨겨진 카테고리 계산
  useEffect(() => {
    let isResizing = false
    let rafId: number | null = null
    
    const checkMobileAndCalculateVisibleCategories = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      if (mobile) {
        const maxVisibleCategories = 3
        
        if (sortedCategories.length <= maxVisibleCategories) {
          setVisibleCategories(sortedCategories)
          setHiddenCategories([])
        } else {
          const visible = sortedCategories.slice(0, maxVisibleCategories)
          const hidden = sortedCategories.slice(maxVisibleCategories)
          setVisibleCategories(visible)
          setHiddenCategories(hidden)
        }
      } else {
        setVisibleCategories(sortedCategories)
        setHiddenCategories([])
        setMobileDropdownOpen(false)
      }
    }
    
    checkMobileAndCalculateVisibleCategories()
    
    // requestAnimationFrame을 사용한 최적화된 리사이즈 핸들러
    const optimizedResize = () => {
      if (!isResizing) {
        isResizing = true
        
        if (rafId) {
          cancelAnimationFrame(rafId)
        }
        
        rafId = requestAnimationFrame(() => {
          checkMobileAndCalculateVisibleCategories()
          isResizing = false
          rafId = null
        })
      }
    }
    
    window.addEventListener('resize', optimizedResize, { passive: true })
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('resize', optimizedResize)
    }
  }, [sortedCategories])

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

  // 마우스가 메뉴 영역을 벗어날 때 지연 시간 후 닫기
  const handleMenuClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    
    requestAnimationFrame(() => {
      closeTimeoutRef.current = setTimeout(() => {
        setHoveredCategory(null)
        closeTimeoutRef.current = null
      }, 250)
    })
  }, [])
  
  // 마우스가 메뉴 영역으로 들어오면 닫기 타이머 취소
  const handleMenuEnter = useCallback((categoryId: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (hoveredCategory !== categoryId) {
      setHoveredCategory(categoryId)
    }
  }, [hoveredCategory])

  // 카테고리 클릭 처리
  const handleCategoryClick = useCallback((categoryId: number) => (e: React.MouseEvent) => {
    const category = sortedCategories.find(cat => cat.id === categoryId)

    if (isMobile && category?.subcategories && category.subcategories.length > 0) {
      // 모바일에서 서브카테고리가 있는 경우 바텀시트 열기
      e.preventDefault()

      // 이미 열린 메뉴를 다시 클릭하면 닫기
      if (bottomSheetCategory === categoryId) {
        setBottomSheetCategory(null)
        return
      }

      setBottomSheetCategory(categoryId)
    } else {
      // 서브카테고리가 없거나 데스크톱인 경우 직접 선택
      const id = categoryId.toString()
      setActiveCategory(id)
      updateUrlCategory(id)
    }
  }, [isMobile, sortedCategories, bottomSheetCategory, updateUrlCategory])

  // 모바일 드롭다운 토글
  const toggleMobileDropdown = useCallback(() => {
    setMobileDropdownOpen(!mobileDropdownOpen)
  }, [mobileDropdownOpen])

  const hoveredCategoryData = hoveredCategory ? sortedCategories.find(cat => cat.id === hoveredCategory) : null
  const bottomSheetCategoryData = bottomSheetCategory ? sortedCategories.find(cat => cat.id === bottomSheetCategory) : null

  // 메뉴 위치 설정 - 호버된 카테고리가 바뀔 때만 실행
  useEffect(() => {
    if (!hoveredCategory || !menuItemsRef.current[hoveredCategory]) return
    
    requestAnimationFrame(() => {
      const menuItem = menuItemsRef.current[hoveredCategory]
      if (menuItem) {
        const parentLeft = menuItem.offsetLeft
        setMenuPosition({ left: parentLeft })
      }
    })
  }, [hoveredCategory])

  return (
    <div>
      {/* HoverMenu 스타일에 맞춘 탭 바 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg mb-4">
        <div className="px-4 py-2.5 relative" ref={containerRef}>
          {/* 네비게이션 바 */}
          <nav className="flex items-center justify-between gap-1" ref={navRef}>
            {/* 카테고리 목록 */}
            <div className="flex items-center gap-1 flex-1 overflow-x-auto">
              {/* 전체 버튼 */}
              <Button
                onClick={() => {
                  setActiveCategory('all')
                  updateUrlCategory('all')
                }}
                variant="ghost"
                className={`px-2 py-1 h-auto text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'all' ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                }`}
              >
                전체
              </Button>

              {/* 보이는 카테고리들 */}
              {visibleCategories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  ref={(el) => {
                    menuItemsRef.current[category.id] = el
                  }}
                  onMouseEnter={() => !isMobile && handleMenuEnter(category.id)}
                  onMouseLeave={(e) => {
                    if (isMobile) return
                    
                    // dropdown 영역으로 진입하지 않으면 닫기
                    const relatedTarget = e.relatedTarget as Node
                    if (
                      menuRef.current && 
                      (menuRef.current.contains(relatedTarget) || menuRef.current === relatedTarget)
                    ) {
                      return
                    }
                    
                    handleMenuClose()
                  }}
                >
                  <Button
                    onClick={handleCategoryClick(category.id)}
                    variant="ghost"
                    className={`px-2 py-1 h-auto text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${
                      activeCategory === category.id.toString()
                        ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                        : ''
                    }`}
                  >
                    {category.name}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
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
                  </Button>
                </div>
              ))}
            </div>

            {/* 드롭다운 버튼 (숨겨진 카테고리가 있을 때만) */}
            {hiddenCategories.length > 0 && (
              <Button
                onClick={toggleMobileDropdown}
                variant="ghost"
                className="px-2 py-1 h-auto flex-shrink-0"
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
              </Button>
            )}
          </nav>

          {/* 숨겨진 카테고리들을 위한 드롭다운 메뉴 */}
          {mobileDropdownOpen && hiddenCategories.length > 0 && (
            <div className="mt-2 pt-2 border-t border-black/7 dark:border-white/10">
              <div className="flex flex-wrap gap-1">
                {hiddenCategories.map((category) => (
                  <div
                    key={category.id}
                    className="relative"
                    ref={(el) => {
                      menuItemsRef.current[category.id] = el
                    }}
                    onMouseEnter={() => !isMobile && handleMenuEnter(category.id)}
                    onMouseLeave={(e) => {
                      if (isMobile) return
                      
                      const relatedTarget = e.relatedTarget as Node
                      if (
                        menuRef.current && 
                        (menuRef.current.contains(relatedTarget) || menuRef.current === relatedTarget)
                      ) {
                        return
                      }
                      
                      handleMenuClose()
                    }}
                  >
                    <Button
                      onClick={handleCategoryClick(category.id)}
                      variant="ghost"
                      className={`px-2 py-1 h-auto text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${
                        activeCategory === category.id.toString()
                          ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                          : ''
                      }`}
                    >
                      {category.name}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
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
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 하위 메뉴 (호버 메뉴) - 데스크톱 */}
          {!isMobile && hoveredCategory && hoveredCategoryData && hoveredCategoryData.subcategories && hoveredCategoryData.subcategories.length > 0 && (
            <div
              ref={menuRef}
              onMouseEnter={() => handleMenuEnter(hoveredCategory)}
              onMouseLeave={() => handleMenuClose()}
              className="absolute bg-white dark:bg-[#1D1D1D] shadow-lg border border-black/7 dark:border-white/10 z-40 top-[100%] overflow-hidden rounded-lg"
              style={{
                left: `${menuPosition.left}px`,
                marginTop: '-7px',
              }}
            >
              {/* 하위 카테고리 - flex wrap */}
              <div className="flex flex-wrap max-w-[500px]">
                {(hoveredCategoryData.subcategories ?? [])
                  .sort((a, b) => {
                    if (a.display_order !== undefined && b.display_order !== undefined) {
                      if (a.display_order !== b.display_order) {
                        return a.display_order - b.display_order
                      }
                    }
                    return a.name.localeCompare(b.name)
                  })
                  .map((sub) => (
                    <Button
                      key={sub.id}
                      onClick={() => {
                        const id = sub.id.toString()
                        setActiveCategory(id)
                        updateUrlCategory(id)
                        setHoveredCategory(null)
                      }}
                      variant="ghost"
                      className={`px-3 py-2 h-auto text-xs whitespace-nowrap rounded-none ${
                        activeCategory === sub.id.toString()
                          ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                          : 'bg-white dark:bg-[#1D1D1D]'
                      }`}
                      title={sub.name}
                    >
                      {sub.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

  {/* 로그인 안내가 있을 경우, 탭 바로 아래에 표시 */}
  {loginNotice && (
    <div className="mb-3">
      {loginNotice}
    </div>
  )}

      {/* 데스크톱 드롭다운 제거: HoverMenu 스타일 상단 패널로 대체됨 */}

      {/* 모바일: 바텀시트 - 하위 카테고리 */}
      {isMobile && bottomSheetCategory && bottomSheetCategoryData && bottomSheetCategoryData.subcategories && bottomSheetCategoryData.subcategories.length > 0 && ReactDOM.createPortal(
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setBottomSheetCategory(null)}
          />
          {/* 바텀시트 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1D1D1D] rounded-t-lg z-50 animate-slide-up" ref={bottomSheetRef}>
            {/* 헤더 */}
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
              <h3 className="text-xs sm:text-sm text-gray-900 dark:text-[#F0F0F0]">
                {bottomSheetCategoryData.name}
              </h3>
              <Button
                onClick={() => setBottomSheetCategory(null)}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            {/* 콘텐츠 */}
            <div className="max-h-96 overflow-y-auto">
              <Button
                onClick={() => {
                  if (bottomSheetCategory == null) return
                  const id = bottomSheetCategory.toString()
                  setActiveCategory(id)
                  updateUrlCategory(id)
                  setBottomSheetCategory(null)
                }}
                variant="ghost"
                className="w-full text-left justify-start px-4 py-2.5 h-auto text-xs sm:text-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-none border-b border-black/5 dark:border-white/10"
              >
                {bottomSheetCategoryData.name} 전체 보기
              </Button>
              {bottomSheetCategoryData.subcategories
                .sort((a, b) => {
                  if (a.display_order !== undefined && b.display_order !== undefined) {
                    if (a.display_order !== b.display_order) {
                      return a.display_order - b.display_order
                    }
                  }
                  return a.name.localeCompare(b.name)
                })
                .map((sub, index, arr) => (
                  <Button
                    key={sub.id}
                    onClick={() => {
                      const id = sub.id.toString()
                      setActiveCategory(id)
                      updateUrlCategory(id)
                      setBottomSheetCategory(null)
                    }}
                    variant="ghost"
                    className={`w-full text-left justify-start px-4 py-2.5 h-auto text-xs sm:text-sm text-gray-900 dark:text-[#F0F0F0] rounded-none ${
                      index < arr.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
                    } ${
                      activeCategory === sub.id.toString()
                        ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                        : 'bg-white dark:bg-[#1D1D1D]'
                    }`}
                  >
                    {sub.name}
                  </Button>
                ))}
            </div>
          </div>
        </>,
        document.body
      )}

      <div className="space-y-4">
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
        <AdSense
          adSlot="8132343983"
          adFormat="auto"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
} 
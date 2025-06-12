'use client'

import { useState, useEffect } from 'react'

type SearchType = 'all' | 'posts' | 'comments' | 'teams'

interface PopularSearch {
  search_query: string
  search_type: string
  search_count: number
}

interface PopularSearchesProps {
  searchType?: SearchType
  onSearchClick?: (query: string) => void
}

export default function PopularSearches({ 
  searchType = 'all', 
  onSearchClick 
}: PopularSearchesProps) {
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPopularSearches() {
      try {
        setLoading(true)
        // 서버 액션 호출 (동적 import)
        const { getPopularSearches } = await import('../actions/searchLogs')
        const searches = await getPopularSearches(searchType, 8)
        setPopularSearches(searches)
      } catch (error) {
        console.error('인기 검색어 조회 실패:', error)
        setPopularSearches([])
      } finally {
        setLoading(false)
      }
    }

    fetchPopularSearches()
  }, [searchType])

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">인기 검색어</h3>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="h-6 bg-gray-200 rounded-full animate-pulse"
              style={{ width: `${60 + Math.random() * 40}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (popularSearches.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">인기 검색어</h3>
      <div className="flex flex-wrap gap-2">
        {popularSearches.map((search, index) => (
          <button
            key={`${search.search_query}-${index}`}
            onClick={() => onSearchClick?.(search.search_query)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            <span className="text-blue-500 font-medium">#{index + 1}</span>
            <span>{search.search_query}</span>
            <span className="text-gray-500">({search.search_count})</span>
          </button>
        ))}
      </div>
    </div>
  )
} 
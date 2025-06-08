'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// SVG 아이콘을 직접 사용

interface SearchBarProps {
  placeholder?: string
  initialQuery?: string
  onSearch?: (query: string) => void
  className?: string
}

export default function SearchBar({ 
  placeholder = "게시글, 팀, 뉴스 검색...",
  initialQuery = "",
  onSearch,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    
    if (!trimmedQuery) return

    setIsLoading(true)

    try {
      if (onSearch) {
        // 부모 컴포넌트에서 검색 처리
        await onSearch(trimmedQuery)
      } else {
        // 검색 페이지로 이동
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('q', trimmedQuery)
        router.push(`/search?${params.toString()}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className={`h-5 w-5 transition-colors ${
              isLoading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={`
            block w-full pl-10 pr-12 py-2.5 
            border border-gray-300 rounded-lg
            bg-white text-gray-900 placeholder-gray-500
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            transition-colors duration-200
            text-sm sm:text-base
          `}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`
              mr-2 px-3 py-1.5 text-sm font-medium rounded-md
              transition-colors duration-200
              ${query.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? '검색중...' : '검색'}
          </button>
        </div>
      </div>
      
      {/* 검색 제안 (추후 구현) */}
      {/* <SearchSuggestions query={query} onSelect={setQuery} /> */}
    </form>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  initialQuery?: string
  onSearch?: (query: string) => void
  className?: string
}

export default function SearchBar({
  placeholder = "게시글, 댓글 검색...",
  initialQuery = "",
  onSearch,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

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

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        {/* 검색 아이콘 */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className={`h-5 w-5 transition-colors ${
              isLoading ? 'text-gray-500 dark:text-gray-400 animate-pulse' : 'text-gray-400'
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

        {/* 검색 입력창 */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={`
            block w-full pl-10 pr-20 py-2.5 sm:py-3
            border border-black/7 dark:border-white/10 rounded-lg
            bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder-gray-500 dark:placeholder-gray-400
            outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
            focus:bg-[#EAEAEA] dark:focus:bg-[#333333]
            disabled:bg-[#F5F5F5] dark:disabled:bg-[#262626] disabled:text-gray-500 dark:disabled:text-gray-400
            transition-colors duration-200
            text-sm sm:text-base
          `}
        />

        {/* 검색 버튼 */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`
              mr-2 px-4 py-2 text-sm font-medium rounded-md
              outline-none focus:outline-none
              transition-colors duration-200
              ${query.trim() && !isLoading
                ? 'bg-gray-900 dark:bg-[#F0F0F0] text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? '검색중...' : '검색'}
          </button>
        </div>
      </div>
    </form>
  )
}

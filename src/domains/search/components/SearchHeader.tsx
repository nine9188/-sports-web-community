'use client'

import SearchBar from './SearchBar'

interface SearchHeaderProps {
  title?: string
  description?: string
  initialQuery?: string
  className?: string
  showSearchBar?: boolean
}

export default function SearchHeader({
  title = "검색",
  description = "게시글, 댓글, 팀을 검색해보세요",
  initialQuery = "",
  className = "",
  showSearchBar = false
}: SearchHeaderProps) {

  const trimmedQuery = (initialQuery || '').trim()
  const heading = trimmedQuery ? `${trimmedQuery} 검색결과` : title

  return (
    <div className={`bg-white rounded-lg border shadow-sm mb-4 ${className}`}>
      {/* 헤더 섹션 */}
      <div className="px-4 py-4 sm:px-6 border-b">
        <div>
          <h1 className="text-lg font-medium text-gray-900">{heading}</h1>
          {!trimmedQuery && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      
      {showSearchBar && (
        <div className="p-4 sm:p-6">
          <SearchBar 
            initialQuery={initialQuery}
            placeholder="게시글, 댓글, 팀 검색..."
            className="w-full"
          />
        </div>
      )}
    </div>
  )
} 
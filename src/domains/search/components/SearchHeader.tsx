'use client'

interface SearchHeaderProps {
  title?: string
  description?: string
  initialQuery?: string
  className?: string
}

export default function SearchHeader({
  title = "검색",
  description = "게시글, 댓글, 팀을 검색해보세요",
  initialQuery = "",
  className = "",
}: SearchHeaderProps) {

  const trimmedQuery = (initialQuery || '').trim()
  const heading = trimmedQuery ? `"${trimmedQuery}" 에 대한 검색결과` : title

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 mb-4 ${className}`}>
      {/* 헤더 섹션 */}
      <div className="px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900 dark:text-[#F0F0F0]">{heading}</h1>
          {!trimmedQuery && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
} 
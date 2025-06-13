'use client'

import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  query: string
  type: 'posts' | 'comments' | 'teams'
  sort: 'latest' | 'views' | 'likes'
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  query,
  type,
  sort
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('q', query)
    params.set('type', type)
    if (sort !== 'latest') params.set('sort', sort)
    if (page > 1) params.set('page', page.toString())
    return `/search?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      {/* 모바일 버전 */}
      <div className="flex flex-1 justify-between sm:hidden">
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            이전
          </Link>
        ) : (
          <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            이전
          </span>
        )}
        
        <span className="text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>
        
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            다음
          </Link>
        ) : (
          <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            다음
          </span>
        )}
      </div>

      {/* 데스크탑 버전 */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            총 <span className="font-medium">{totalItems}</span>개 중{' '}
            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>-
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>개 표시
          </p>
        </div>
        
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            {/* 이전 버튼 */}
            {currentPage > 1 ? (
              <Link
                href={createPageUrl(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                이전
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                이전
              </span>
            )}

            {/* 페이지 번호들 (간단 버전) */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              const isCurrentPage = pageNum === currentPage
              
              return (
                <Link
                  key={pageNum}
                  href={createPageUrl(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    isCurrentPage
                      ? 'z-10 bg-blue-600 text-white'
                      : 'text-gray-900'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            })}

            {/* 다음 버튼 */}
            {currentPage < totalPages ? (
              <Link
                href={createPageUrl(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                다음
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                다음
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
} 
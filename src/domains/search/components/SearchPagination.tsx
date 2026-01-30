'use client'

import { Suspense } from 'react'
import { Pagination } from '@/shared/components/ui'

interface SearchPaginationProps {
  query: string
  type: 'posts' | 'comments' | 'teams'
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

function PaginationContent({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      mode="url"
      withMargin={false}
    />
  )
}

export default function SearchPagination({
  query,
  type,
  currentPage,
  totalItems,
  itemsPerPage,
}: SearchPaginationProps) {
  if (!query || totalItems <= itemsPerPage) {
    return null
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <Suspense fallback={<div className="h-12" />}>
      <PaginationContent currentPage={currentPage} totalPages={totalPages} />
    </Suspense>
  )
}

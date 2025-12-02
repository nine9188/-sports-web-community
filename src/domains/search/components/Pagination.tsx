'use client'
import ShopPagination from '@/domains/shop/components/ShopPagination'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null

  // ShopPagination은 현재 경로와 쿼리 유지/변경을 내부에서 처리
  return (
    <div className="w-full">
      <div className="px-4 sm:px-6">
        <ShopPagination
          page={currentPage}
          pageSize={itemsPerPage}
          total={totalItems}
          withMargin={false}
        />
      </div>
    </div>
  )
} 
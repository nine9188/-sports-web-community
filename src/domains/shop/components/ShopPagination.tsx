'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface ShopPaginationProps {
  page: number
  pageSize: number
  total: number
  withMargin?: boolean
}

export default function ShopPagination({ page, pageSize, total, withMargin = true }: ShopPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (targetPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(targetPage))
    }
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  const prevPage = Math.max(1, currentPage - 1)
  const nextPage = Math.min(totalPages, currentPage + 1)

  const pages: number[] = []
  // 모바일은 5개, md 이상은 7개 버튼
  const isClient = typeof window !== 'undefined'
  const isMobile = isClient ? window.innerWidth < 768 : false
  const maxButtons = isMobile ? 5 : 7
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
  const end = Math.min(totalPages, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav className={`flex items-center justify-center gap-1 ${withMargin ? 'mt-4' : ''}`} aria-label="페이지네이션">
      <Link
        href={buildHref(1)}
        aria-label="첫 페이지"
        className={`px-3 py-2 rounded border text-sm ${currentPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
      >
        «
      </Link>
      <Link
        href={buildHref(prevPage)}
        aria-label="이전 페이지"
        className={`px-3 py-2 rounded border text-sm ${currentPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
      >
        ‹
      </Link>

      {pages.map(p => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`px-3 py-2 rounded border text-sm ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(nextPage)}
        aria-label="다음 페이지"
        className={`px-3 py-2 rounded border text-sm ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
      >
        ›
      </Link>
      <Link
        href={buildHref(totalPages)}
        aria-label="마지막 페이지"
        className={`px-3 py-2 rounded border text-sm ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
      >
        »
      </Link>
    </nav>
  )
}



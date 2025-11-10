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

  // 모바일/데스크탑 모두 7개 버튼 생성 (CSS로 일부 숨김 처리)
  const pages: number[] = []
  const maxButtons = 7
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
  const end = Math.min(totalPages, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav className={`flex items-center justify-center gap-1 ${withMargin ? 'mt-4' : ''}`} aria-label="페이지네이션">
      <Link
        href={buildHref(1)}
        aria-label="첫 페이지"
        className={`px-3 py-2 rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-sm transition-colors ${currentPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`}
      >
        «
      </Link>
      <Link
        href={buildHref(prevPage)}
        aria-label="이전 페이지"
        className={`px-3 py-2 rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-sm transition-colors ${currentPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`}
      >
        ‹
      </Link>

      {pages.map((p, index) => {
        // 모바일에서는 가운데 5개만 표시 (양 끝 1개씩 숨김)
        const hideOnMobile = pages.length === 7 && (index === 0 || index === 6)
        return (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`px-3 py-2 rounded text-sm transition-colors ${p === currentPage ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white' : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'} ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
          >
            {p}
          </Link>
        )
      })}

      <Link
        href={buildHref(nextPage)}
        aria-label="다음 페이지"
        className={`px-3 py-2 rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-sm transition-colors ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`}
      >
        ›
      </Link>
      <Link
        href={buildHref(totalPages)}
        aria-label="마지막 페이지"
        className={`px-3 py-2 rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-sm transition-colors ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}`}
      >
        »
      </Link>
    </nav>
  )
}



'use client'

import Link from 'next/link'
import type { CommentSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { formatDate } from '@/shared/utils/dateUtils'

interface CommentSearchResultsProps {
  comments: CommentSearchResult[]
  query: string
  isLoading?: boolean
  pagination?: {
    currentPage: number
    totalItems: number
    itemsPerPage: number
    sort: 'latest' | 'views' | 'likes'
  }
  showMoreButton?: boolean
  currentType?: 'all' | 'posts' | 'comments' | 'teams'
}

export default function CommentSearchResults({
  comments,
  query,
  isLoading = false,
  pagination,
  showMoreButton = false,
  currentType = 'comments'
}: CommentSearchResultsProps) {
  const handleCommentClick = async (comment: CommentSearchResult) => {
    try {
      await trackSearchResultClick({
        search_query: query,
        clicked_result_id: comment.id,
        clicked_result_type: 'comment'
      })
    } catch (error) {
      console.error('댓글 클릭 추적 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    )
  }

  if (!comments.length && query) {
    return (
      <div className="text-center py-8 text-gray-500 text-[13px]">
        댓글 검색 결과가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          댓글 ({pagination?.totalItems || comments.length}개)
        </h3>
      </div>

      <div className="divide-y divide-black/5 dark:divide-white/10">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <Link
              href={`/boards/${comment.posts?.boards?.slug || 'unknown'}/${comment.posts?.post_number || 0}#comment-${comment.id}`}
              className="block"
              prefetch={false}
              onClick={() => handleCommentClick(comment)}
            >
              <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 transition-colors">
                <span className="inline-block px-2 py-0.5 text-xs bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 rounded mr-2">
                  댓글
                </span>
                {highlightQuery(comment.snippet || '댓글 내용', query)}
              </div>

              <div className="text-gray-700 dark:text-gray-300 text-xs mb-3">
                원글: {comment.post_title || comment.posts?.title || '제목 없음'}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <span>{comment.author_name || comment.profiles?.nickname || '익명'}</span>
                  {(comment.board_name || comment.posts?.boards?.name) && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {comment.board_name || comment.posts?.boards?.name}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span>좋아요 {comment.likes || 0}</span>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {pagination && currentType === 'comments' && (
        <PaginationSummary pagination={pagination} />
      )}

      {showMoreButton && currentType === 'all' && comments.length >= 5 && (
        <div className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <Link
            href={`/search?q=${encodeURIComponent(query)}&type=comments`}
            className="text-[13px] text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
          prefetch={false}
          >
            더 많은 댓글 보기 ({pagination?.totalItems || 0}개)
          </Link>
        </div>
      )}
    </div>
  )
}

function PaginationSummary({
  pagination
}: {
  pagination: NonNullable<CommentSearchResultsProps['pagination']>
}) {
  const start = (pagination.currentPage - 1) * pagination.itemsPerPage + 1
  const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)

  return (
    <div className="px-4 sm:px-6 py-3 border-t border-black/7 dark:border-white/10">
      <p className="text-[13px] text-gray-700 dark:text-gray-300">
        총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
        <span className="font-medium">{start}</span>-
        <span className="font-medium">{end}</span>개 표시
      </p>
    </div>
  )
}

function highlightQuery(text: string, searchQuery: string) {
  if (!searchQuery.trim()) return text

  const escapedQuery = escapeRegExp(searchQuery.trim())
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

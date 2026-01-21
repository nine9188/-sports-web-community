'use client'

import Link from 'next/link'
import type { CommentSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { formatDate } from '@/shared/utils/dateUtils'
import Spinner from '@/shared/components/Spinner';

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
  // 댓글 클릭 추적
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
      <div className="text-center py-8">
        <Spinner size="lg" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">댓글 로딩 중...</p>
      </div>
    )
  }

  if (!comments.length && query) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        댓글 검색 결과가 없습니다
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          댓글 ({pagination?.totalItems || comments.length}개)
        </h3>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-black/5 dark:divide-white/10">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <Link
              href={`/boards/${comment.posts?.boards?.slug || 'unknown'}/${comment.posts?.post_number || 0}#comment-${comment.id}`}
              className="block"
              onClick={() => handleCommentClick(comment)}
            >
              {/* 댓글 내용 */}
              <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 transition-colors">
                <span className="inline-block px-2 py-0.5 text-xs bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 rounded mr-2">
                  댓글
                </span>
                {highlightQuery(comment.snippet || '댓글 내용', query)}
              </div>

              {/* 원글 제목 */}
              <div className="text-gray-700 dark:text-gray-300 text-xs mb-3">
                원글: {comment.post_title || comment.posts?.title || '제목 없음'}
              </div>

              {/* 메타 정보 */}
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

        {/* 요약 문구 */}
        {pagination && currentType === 'comments' && (
          <div className="px-4 sm:px-6 py-3 border-t border-black/7 dark:border-white/10">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
              <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span>-
              <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span>개 표시
            </p>
          </div>
        )}

      {/* 더보기 버튼 (전체 탭에서만 표시) */}
      {showMoreButton && currentType === 'all' && comments.length >= 5 && (
        <div className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <Link
            href={`/search?q=${encodeURIComponent(query)}&type=comments`}
            className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
          >
            더 많은 댓글 보기 ({pagination?.totalItems || 0}개) →
          </Link>
        </div>
      )}
      
      </div>

    </>
  )
}

// 검색어 하이라이트
function highlightQuery(text: string, searchQuery: string) {
  if (!searchQuery.trim()) return text
  
  const regex = new RegExp(`(${searchQuery})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  )
}



 
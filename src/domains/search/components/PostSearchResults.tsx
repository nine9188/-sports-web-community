'use client'

import Link from 'next/link'
import type { PostSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { formatDate } from '@/shared/utils/dateUtils'
import Spinner from '@/shared/components/Spinner';

interface PostSearchResultsProps {
  posts: PostSearchResult[]
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

export default function PostSearchResults({ 
  posts, 
  query, 
  isLoading = false,
  pagination,
  showMoreButton = false,
  currentType = 'posts'
}: PostSearchResultsProps) {
  // 게시글 클릭 추적
  const handlePostClick = async (post: PostSearchResult) => {
    try {
      await trackSearchResultClick({
        search_query: query,
        clicked_result_id: post.id,
        clicked_result_type: 'post'
      })
    } catch (error) {
      console.error('게시글 클릭 추적 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">게시글 로딩 중...</p>
      </div>
    )
  }

  if (!posts.length && query) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        게시글 검색 결과가 없습니다
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          게시글 ({pagination?.totalItems || posts.length}개)
        </h3>
      </div>

      {/* 게시글 목록 */}
      <div className="divide-y divide-black/5 dark:divide-white/10">
        {posts.map((post) => (
          <div key={post.id} className="p-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <Link
              href={`/boards/${post.boards?.slug || 'unknown'}/${post.post_number}`}
              className="block"
              onClick={() => handlePostClick(post)}
            >
              {/* 제목 */}
              <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 transition-colors">
                {highlightQuery(post.title, query)}
              </div>

              {/* 내용 스니펫 */}
              {post.snippet && (
                <div className="text-gray-700 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                  {highlightQuery(post.snippet, query)}
                </div>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <span>{post.author_name || post.profiles?.nickname || '익명'}</span>
                  {(post.board_name || post.boards?.name) && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {post.board_name || post.boards?.name}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span>조회 {post.views ? post.views.toLocaleString() : '0'}</span>
                  <span>좋아요 {post.likes || 0}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

        {/* 요약 문구 */}
        {pagination && currentType === 'posts' && (
          <div className="px-4 sm:px-6 py-3 border-t border-black/7 dark:border-white/10">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
              <span className="font-medium">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span>-
              <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span>개 표시
            </p>
          </div>
        )}

      {/* 더보기 버튼 (전체 탭에서만 표시) */}
      {showMoreButton && currentType === 'all' && posts.length >= 5 && (
        <div className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <Link
            href={`/search?q=${encodeURIComponent(query)}&type=posts`}
            className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
          >
            더 많은 게시글 보기 ({pagination?.totalItems || 0}개) →
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

// 날짜 포맷팅


 
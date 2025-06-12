'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import UserIcon from '@/shared/components/UserIcon'
import type { CommentSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'

interface CommentSearchResultsProps {
  comments: CommentSearchResult[]
  query: string
  isLoading?: boolean
}

export default function CommentSearchResults({ 
  comments, 
  query, 
  isLoading = false 
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
    return <CommentSearchSkeleton />
  }

  if (!comments.length && query) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">
            댓글 ({comments.length}개)
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 text-sm">
          댓글 검색 결과가 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-medium text-gray-900">
          댓글 ({comments.length}개)
        </h3>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-200">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-gray-50 transition-colors">
            <Link 
              href={`/boards/${comment.posts?.boards?.slug || 'unknown'}/${comment.posts?.post_number || 0}#comment-${comment.id}`}
              className="block"
              onClick={() => handleCommentClick(comment)}
            >
              {/* 댓글 내용 */}
              <div className="text-sm font-medium text-gray-900 hover:text-blue-600 mb-2 transition-colors">
                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded mr-2">
                  댓글
                </span>
                {highlightQuery(comment.snippet || '댓글 내용', query)}
              </div>
              
              {/* 원글 제목 */}
              <div className="text-gray-600 text-xs mb-3">
                원글: {comment.post_title || comment.posts?.title || '제목 없음'}
              </div>
              
              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  {(comment.board_name || comment.posts?.boards?.name) && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {comment.board_name || comment.posts?.boards?.name}
                    </span>
                  )}
                  <div className="flex items-center space-x-1">
                    <UserIcon 
                      iconUrl={null}
                      level={1}
                      size={14}
                      className="w-3.5 h-3.5"
                    />
                    <span>{comment.author_name || comment.profiles?.nickname || '익명'}</span>
                  </div>
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
    </div>
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
function formatDate(dateString?: string | null) {
  if (!dateString) return ''
  
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ko 
    })
  } catch {
    return dateString
  }
}

function CommentSearchSkeleton() {
  return (
    <div className="bg-white rounded-lg border">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="flex justify-between items-center mt-3">
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
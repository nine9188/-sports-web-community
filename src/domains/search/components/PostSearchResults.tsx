'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import UserIcon from '@/shared/components/UserIcon'
import type { PostSearchResult } from '../types'

interface PostSearchResultsProps {
  posts: PostSearchResult[]
  query: string
  isLoading?: boolean
}

export default function PostSearchResults({ 
  posts, 
  query, 
  isLoading = false 
}: PostSearchResultsProps) {
  if (isLoading) {
    return <PostSearchSkeleton />
  }

  if (!posts.length && query) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">
            게시글 ({posts.length}개)
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 text-sm">
          게시글 검색 결과가 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-medium text-gray-900">
          게시글 ({posts.length}개)
        </h3>
      </div>

      {/* 게시글 목록 */}
      <div className="divide-y divide-gray-200">
        {posts.map((post) => (
          <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
            <Link 
              href={`/boards/${post.boards?.slug || 'unknown'}/${post.post_number}`}
              className="block"
            >
              {/* 제목 */}
              <div className="text-sm font-medium text-gray-900 hover:text-blue-600 mb-2 transition-colors">
                {highlightQuery(post.title, query)}
              </div>
              
              {/* 내용 스니펫 */}
              {post.snippet && (
                <div className="text-gray-600 text-xs mb-3 line-clamp-2">
                  {highlightQuery(post.snippet, query)}
                </div>
              )}
              
              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  {(post.board_name || post.boards?.name) && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {post.board_name || post.boards?.name}
                    </span>
                  )}
                  <div className="flex items-center space-x-1">
                    <UserIcon 
                      iconUrl={null}
                      level={1}
                      size={14}
                      className="w-3.5 h-3.5"
                    />
                    <span>{post.author_name || post.profiles?.nickname || '익명'}</span>
                  </div>
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

function PostSearchSkeleton() {
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
              <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="flex justify-between items-center mt-3">
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
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
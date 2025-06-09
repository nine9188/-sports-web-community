'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { searchContent } from '@/domains/search/actions'
import type { SearchResponse } from '@/domains/search/types'

interface SearchPageClientProps {
  initialQuery: string
  initialType: 'all' | 'posts' | 'comments'
  initialSort: 'latest' | 'views' | 'likes'
  initialData: SearchResponse
}

export default function SearchPageClient({
  initialQuery,
  initialType,
  initialSort,
  initialData
}: SearchPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [sort, setSort] = useState(initialSort)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState<string | null>(null)

  // 검색 실행
  const handleSearch = async () => {
    if (!query.trim()) {
      setData({ posts: [], comments: [], totalCount: 0 })
      updateURL('', type, sort)
      return
    }

    startTransition(async () => {
      try {
        setError(null)
        const result = await searchContent({
          query: query.trim(),
          type,
          sortBy: sort,
          limit: 20
        })
        setData(result)
        updateURL(query.trim(), type, sort)
      } catch (err) {
        console.error('검색 오류:', err)
        setError('검색 중 오류가 발생했습니다.')
        setData({ posts: [], comments: [], totalCount: 0 })
      }
    })
  }

  // URL 업데이트
  const updateURL = (searchQuery: string, searchType: string, searchSort: string) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (searchType !== 'all') params.set('type', searchType)
    if (searchSort !== 'latest') params.set('sort', searchSort)
    
    const newURL = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL, { scroll: false })
  }

  // 타입 변경
  const handleTypeChange = (newType: 'all' | 'posts' | 'comments') => {
    setType(newType)
    if (query.trim()) {
      startTransition(async () => {
        try {
          const result = await searchContent({
            query: query.trim(),
            type: newType,
            sortBy: sort,
            limit: 20
          })
          setData(result)
          updateURL(query.trim(), newType, sort)
        } catch (err) {
          console.error('검색 오류:', err)
          setError('검색 중 오류가 발생했습니다.')
        }
      })
    }
  }

  // 정렬 변경
  const handleSortChange = (newSort: 'latest' | 'views' | 'likes') => {
    setSort(newSort)
    if (query.trim()) {
      startTransition(async () => {
        try {
          const result = await searchContent({
            query: query.trim(),
            type,
            sortBy: newSort,
            limit: 20
          })
          setData(result)
          updateURL(query.trim(), type, newSort)
        } catch (err) {
          console.error('검색 오류:', err)
          setError('검색 중 오류가 발생했습니다.')
        }
      })
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // 텍스트 정제
  const cleanText = (text: string | null | undefined, maxLength: number = 50) => {
    if (!text) return ''
    
    const cleanedText = text
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (cleanedText.length > maxLength) {
      return cleanedText.substring(0, maxLength) + '...'
    }
    
    return cleanedText
  }

  const hasResults = data.posts.length > 0 || data.comments.length > 0

  return (
    <div className="p-6">
      {/* 검색창 */}
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="검색어를 입력하세요..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '검색 중...' : '검색'}
          </button>
          
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as 'latest' | 'views' | 'likes')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="latest">최신순</option>
            <option value="views">조회순</option>
            <option value="likes">좋아요순</option>
          </select>
        </div>
        
        {/* 검색 타입 필터 */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'all', label: '전체' },
            { key: 'posts', label: '게시글' },
            { key: 'comments', label: '댓글' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key as 'all' | 'posts' | 'comments')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                type === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 상태 */}
      {isPending && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">검색 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isPending && !error && query && !hasResults && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            검색 결과가 없습니다
          </div>
          <div className="text-gray-400 text-sm">
            다른 검색어를 시도해보세요
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {!isPending && !error && hasResults && (
        <div className="space-y-8">
          {/* 검색 결과 요약 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              검색 결과 ({data.totalCount}개)
            </h2>
          </div>

          {/* 게시글 결과 */}
          {data.posts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                게시글 ({data.posts.length}개)
              </h3>
              
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="flex min-w-0">
                    <div className="flex-1 min-w-0 py-3 px-4 text-left text-sm font-medium text-gray-500">제목</div>
                    <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">작성자</div>
                    <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden md:block">날짜</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">조회</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">좋아요</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {data.posts.map((post) => (
                    <div key={post.id} className="hover:bg-gray-50">
                      <div className="flex items-center min-w-0">
                        <div className="flex-1 min-w-0 py-3 px-4">
                          <Link 
                            href={`/board/${post.board_id}/post/${post.id}`}
                            className="block"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {cleanText(post.snippet, 80)} | {post.board_name || post.boards?.name || '게시판'}
                            </div>
                          </Link>
                        </div>
                        
                        <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          <div className="truncate">
                            {cleanText(post.author_name || post.profiles?.nickname || '익명', 8)}
                          </div>
                        </div>
                        
                        <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden md:block">
                          <div className="truncate">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                        
                        <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          {post.views || 0}
                        </div>
                        
                        <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          {post.likes || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 댓글 결과 */}
          {data.comments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                댓글 ({data.comments.length}개)
              </h3>
              
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="flex min-w-0">
                    <div className="flex-1 min-w-0 py-3 px-4 text-left text-sm font-medium text-gray-500">내용</div>
                    <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">작성자</div>
                    <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden md:block">날짜</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">좋아요</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {data.comments.map((comment) => (
                    <div key={comment.id} className="hover:bg-gray-50">
                      <div className="flex items-center min-w-0">
                        <div className="flex-1 min-w-0 py-3 px-4">
                          <Link 
                            href={`/board/${comment.posts?.board_id}/post/${comment.post_id}#comment-${comment.id}`}
                            className="block"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">댓글</span>
                              {cleanText(comment.snippet, 80)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {cleanText(comment.post_title || comment.posts?.title || '제목 없음', 50)} | {comment.board_name || comment.posts?.boards?.name || '게시판'}
                            </div>
                          </Link>
                        </div>
                        
                        <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          <div className="truncate">
                            {cleanText(comment.author_name || comment.profiles?.nickname || '익명', 8)}
                          </div>
                        </div>
                        
                        <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden md:block">
                          <div className="truncate">
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                        
                        <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          {comment.likes || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
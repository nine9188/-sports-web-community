'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { searchAll } from '@/domains/search/actions'
import type { PostSearchResult, CommentSearchResult } from '@/domains/search/types'

interface SearchPageContentProps {
  initialQuery: string
  initialSort: string
  initialPage: number
}

export default function SearchPageContent({
  initialQuery,
  initialSort
}: SearchPageContentProps) {
  const router = useRouter()
  
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort)
  const [searchType, setSearchType] = useState<'all' | 'posts' | 'comments'>('all')
  const [posts, setPosts] = useState<PostSearchResult[]>([])
  const [comments, setComments] = useState<CommentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // 검색 실행
  const handleSearch = useCallback(async (searchQuery: string, sortBy: string = 'latest', type: 'all' | 'posts' | 'comments' = 'all') => {
    if (!searchQuery.trim()) {
      setPosts([])
      setComments([])
      setTotalCount(0)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchAll({
        query: searchQuery.trim(),
        type,
        sortBy: sortBy as 'latest' | 'views' | 'likes',
        limit: 20
      })
      
      setPosts(searchResults.posts)
      setComments(searchResults.comments)
      setTotalCount(searchResults.totalCount)
    } catch (err) {
      console.error('검색 오류:', err)
      setError('검색 중 오류가 발생했습니다.')
      setPosts([])
      setComments([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // URL 업데이트
  const updateURL = useCallback((newQuery: string, newSort: string) => {
    const params = new URLSearchParams()
    if (newQuery) params.set('q', newQuery)
    if (newSort !== 'latest') params.set('sort', newSort)
    
    const newURL = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL)
  }, [router])

  // 검색어 변경 핸들러
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    updateURL(newQuery, sort)
    handleSearch(newQuery, sort, searchType)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    updateURL(query, newSort)
    handleSearch(query, newSort, searchType)
  }

  // 검색 타입 변경 핸들러
  const handleTypeChange = (newType: 'all' | 'posts' | 'comments') => {
    setSearchType(newType)
    handleSearch(query, sort, newType)
  }

  // 초기 검색 실행
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, initialSort, 'all')
    }
  }, [initialQuery, initialSort, handleSearch])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
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

  // HTML 태그 제거 및 텍스트 정제
  const cleanText = (text: string, maxLength: number = 50) => {
    if (!text) return ''
    
    // HTML 태그 제거
    const cleanedText = text
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&[^;]+;/g, ' ') // HTML 엔티티 제거
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .trim()
    
    // 길이 제한
    if (cleanedText.length > maxLength) {
      return cleanedText.substring(0, maxLength) + '...'
    }
    
    return cleanedText
  }

  const hasResults = posts.length > 0 || comments.length > 0

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
                  handleQueryChange(query)
                }
              }}
              placeholder="검색어를 입력하세요..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleQueryChange(query)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {/* 검색 필터 및 결과 헤더 */}
      {(hasResults || query) && (
        <div className="mb-4 pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              {query && (
                <>
                  &apos;<span className="font-medium text-gray-900">{query}</span>&apos; 검색 결과: 
                  <span className="font-medium text-blue-600 ml-1">{totalCount}개</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              {/* 검색 타입 선택 */}
              <select
                value={searchType}
                onChange={(e) => handleTypeChange(e.target.value as 'all' | 'posts' | 'comments')}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="posts">게시글</option>
                <option value="comments">댓글</option>
              </select>
              
              {/* 정렬 선택 */}
              {hasResults && (
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="latest">최신순</option>
                  <option value="views">조회순</option>
                  <option value="likes">추천순</option>
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">검색 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : !hasResults && query ? (
        <div className="text-center py-8">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-8">
          <p className="text-gray-500">검색어를 입력해주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 게시글 결과 */}
          {posts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                게시글 ({posts.length}개)
              </h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="flex min-w-0">
                    <div className="flex-1 min-w-0 py-3 px-4 text-left text-sm font-medium text-gray-500">제목</div>
                    <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">글쓴이</div>
                    <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden md:block">날짜</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">조회</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">추천</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <div key={post.id} className="hover:bg-gray-50">
                      <div className="flex items-center min-w-0">
                        <div className="flex-1 min-w-0 py-3 px-4">
                          <Link 
                            href={`/board/${post.board_id}/post/${post.id}`}
                            className="block"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                              {cleanText(post.title, 80)}
                            </div>
                            {'snippet' in post && (post as { snippet?: string }).snippet && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {cleanText((post as { snippet?: string }).snippet || '', 100)}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {('board_name' in post ? (post as { board_name?: string }).board_name : undefined) || post.boards?.name || '게시판'}
                            </div>
                          </Link>
                        </div>
                        
                        <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          <div className="truncate">
                            {cleanText((post as PostSearchResult & { author_name?: string }).author_name || post.profiles?.nickname || '익명', 8)}
                          </div>
                        </div>
                        
                        <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden md:block">
                          <div className="truncate">
                            {post.created_at ? formatDate(post.created_at) : '-'}
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
          {comments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                댓글 ({comments.length}개)
              </h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="flex min-w-0">
                    <div className="flex-1 min-w-0 py-3 px-4 text-left text-sm font-medium text-gray-500">내용</div>
                    <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">글쓴이</div>
                    <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden md:block">날짜</div>
                    <div className="w-12 flex-shrink-0 py-3 px-2 text-center text-sm font-medium text-gray-500 hidden sm:block">추천</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {comments.map((comment) => (
                    <div key={comment.id} className="hover:bg-gray-50">
                      <div className="flex items-center min-w-0">
                        <div className="flex-1 min-w-0 py-3 px-4">
                          <Link 
                            href={`/board/${comment.posts?.board_id}/post/${comment.post_id}#comment-${comment.id}`}
                            className="block"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">댓글</span>
                              {cleanText(('snippet' in comment ? (comment as { snippet?: string }).snippet : undefined) || '', 80)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {cleanText(('post_title' in comment ? (comment as { post_title?: string }).post_title : undefined) || comment.posts?.title || '제목 없음', 50)} | {('board_name' in comment ? (comment as { board_name?: string }).board_name : undefined) || comment.posts?.boards?.name || '게시판'}
                            </div>
                          </Link>
                        </div>
                        
                        <div className="w-20 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden sm:block">
                          <div className="truncate">
                            {cleanText(('author_name' in comment ? (comment as { author_name?: string }).author_name : undefined) || comment.profiles?.nickname || '익명', 8)}
                          </div>
                        </div>
                        
                        <div className="w-16 flex-shrink-0 py-3 px-2 text-center text-xs text-gray-500 hidden md:block">
                          <div className="truncate">
                            {comment.created_at ? formatDate(comment.created_at) : '-'}
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
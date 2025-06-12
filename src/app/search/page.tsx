import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { searchContent } from '@/domains/search/actions'
import { SearchBar, PostSearchResults, CommentSearchResults, TeamSearchResults } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult, TeamSearchResult } from '@/domains/search/types'

export const metadata: Metadata = {
  title: '검색 - 축구 커뮤니티',
  description: '게시글, 뉴스, 팀 정보를 통합 검색하세요',
}

interface SearchPageProps {
  searchParams: Promise<{ 
    q?: string
    type?: 'all' | 'posts' | 'comments' | 'teams'
    sort?: 'latest' | 'views' | 'likes'
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const type = params.type || 'all'
  const sort = params.sort || 'latest'
  
  // 서버에서 초기 검색 결과 가져오기 (검색어가 있을 때만)
  let posts: PostSearchResult[] = []
  let comments: CommentSearchResult[] = []
  let teams: TeamSearchResult[] = []
  
  if (query.trim()) {
    try {
      const data = await searchContent({
        query: query.trim(),
        type,
        sortBy: sort,
        limit: 20
      })
      
      posts = data.posts
      comments = data.comments
      teams = data.teams
    } catch (error) {
      console.error('초기 검색 오류:', error)
    }
  }

  // 검색 타입 탭 데이터
  const searchTabs = [
    { key: 'all', label: '전체', count: posts.length + comments.length + teams.length },
    { key: 'teams', label: '팀', count: teams.length },
    { key: 'posts', label: '게시글', count: posts.length },
    { key: 'comments', label: '댓글', count: comments.length },
  ]
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h1 className="text-lg font-medium text-gray-900">검색</h1>
          <p className="mt-1 text-sm text-gray-500">게시글, 댓글, 팀을 검색해보세요</p>
        </div>
        
        <div className="p-6">
          <SearchBar 
            initialQuery={query}
            placeholder="게시글, 댓글, 팀 검색..."
            className="mb-6"
          />

          {/* 검색 타입 필터 탭 */}
          {query && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {searchTabs.map((tab) => {
                    const isActive = type === tab.key
                    const href = `/search?q=${encodeURIComponent(query)}&type=${tab.key}${sort !== 'latest' ? `&sort=${sort}` : ''}`
                    
                    return (
                      <Link
                        key={tab.key}
                        href={href}
                        className={`
                          py-2 px-1 border-b-2 font-medium text-sm transition-colors
                          ${isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {tab.label}
                        {query && tab.count > 0 && (
                          <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          )}
          
          {/* 검색 결과가 없을 때 */}
          {query && posts.length === 0 && comments.length === 0 && teams.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                검색 결과가 없습니다
              </div>
              <div className="text-gray-400 text-sm">
                다른 검색어를 시도해보세요
              </div>
            </div>
          )}
          
          {/* 팀 검색 결과 */}
          {(type === 'all' || type === 'teams') && teams.length > 0 && (
            <Suspense fallback={
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">팀 정보 로딩 중...</p>
              </div>
            }>
              <div className="mb-6">
                <TeamSearchResults 
                  teams={teams}
                  total={teams.length}
                  hasMore={false}
                  showMoreButton={type === 'all'}
                />
              </div>
            </Suspense>
          )}
          
          {/* 게시글 검색 결과 */}
          {(type === 'all' || type === 'posts') && posts.length > 0 && (
            <Suspense fallback={
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">게시글 로딩 중...</p>
              </div>
            }>
              <div className="mb-6">
                <PostSearchResults 
                  posts={posts}
                  query={query}
                />
              </div>
            </Suspense>
          )}
          
          {/* 댓글 검색 결과 */}
          {(type === 'all' || type === 'comments') && comments.length > 0 && (
            <Suspense fallback={
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-500">댓글 로딩 중...</p>
              </div>
            }>
              <CommentSearchResults 
                comments={comments}
                query={query}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}

 
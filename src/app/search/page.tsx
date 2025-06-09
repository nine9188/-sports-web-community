import { Suspense } from 'react'
import { Metadata } from 'next'
import { searchContent } from '@/domains/search/actions'
import { SearchBar, PostSearchResults, CommentSearchResults } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult } from '@/domains/search/types'

export const metadata: Metadata = {
  title: '검색 - 축구 커뮤니티',
  description: '게시글, 뉴스, 팀 정보를 통합 검색하세요',
}

interface SearchPageProps {
  searchParams: Promise<{ 
    q?: string
    type?: 'all' | 'posts' | 'comments'
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
    } catch (error) {
      console.error('초기 검색 오류:', error)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h1 className="text-lg font-medium text-gray-900">검색</h1>
          <p className="mt-1 text-sm text-gray-500">게시글과 댓글을 검색해보세요</p>
        </div>
        
        <div className="p-6">
          <SearchBar 
            initialQuery={query}
            placeholder="게시글, 댓글 검색..."
            className="mb-6"
          />
          
          {/* 검색 결과가 없을 때 */}
          {query && posts.length === 0 && comments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                검색 결과가 없습니다
              </div>
              <div className="text-gray-400 text-sm">
                다른 검색어를 시도해보세요
              </div>
            </div>
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

 
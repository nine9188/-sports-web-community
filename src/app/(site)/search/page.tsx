import { Suspense } from 'react'
import { searchContent } from '@/domains/search/actions'
import { SearchHeader, SearchResultsContainer } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult, TeamSearchResult } from '@/domains/search/types'
import { buildMetadata } from '@/shared/utils/metadataNew'
import Spinner from '@/shared/components/Spinner'

// 동적 렌더링 강제 (검색 페이지는 항상 동적으로 렌더링)
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return buildMetadata({
    title: '검색',
    description: '게시글, 댓글, 팀 정보를 통합 검색하세요.',
    path: '/search',
    noindex: true,
  });
}

interface SearchPageProps {
  searchParams: Promise<{ 
    q?: string
    type?: 'all' | 'posts' | 'comments' | 'teams'
    sort?: 'latest' | 'views' | 'likes'
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const type = params.type || 'all'
  const sort = params.sort || 'latest'
  const page = parseInt(params.page || '1', 10)
  
  // 페이지네이션 설정
  const limit = 20
  const offset = (page - 1) * limit
  
  // 서버에서 초기 검색 결과 가져오기 (검색어가 있을 때만)
  let posts: PostSearchResult[] = []
  let comments: CommentSearchResult[] = []
  let teams: TeamSearchResult[] = []
  let pagination = {
    posts: { total: 0, hasMore: false },
    comments: { total: 0, hasMore: false },
    teams: { total: 0, hasMore: false }
  }
  
  if (query.trim()) {
    try {
      const data = await searchContent({
        query: query.trim(),
        type,
        sortBy: sort,
        limit,
        offset
      })
      
      posts = data.posts
      comments = data.comments
      teams = data.teams
      pagination = data.pagination
    } catch (error) {
      console.error('초기 검색 오류:', error)
    }
  }

  return (
    <div className="container mx-auto">
      {/* 검색 헤더 섹션 */}
      <SearchHeader
        initialQuery={query}
      />

      {/* 검색 결과 섹션 */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      }>
        <SearchResultsContainer
          query={query}
          type={type}
          sort={sort}
          page={page}
          posts={posts}
          comments={comments}
          teams={teams}
          pagination={pagination}
        />
      </Suspense>
    </div>
  )
}

 
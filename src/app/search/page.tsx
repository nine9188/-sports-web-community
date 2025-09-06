import { Metadata } from 'next'
import { searchContent } from '@/domains/search/actions'
import { SearchHeader, SearchResultsContainer } from '@/domains/search'
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
    <div className="container mx-auto mt-4 md:mt-0">
      {/* 검색 헤더 섹션 */}
      <SearchHeader 
        initialQuery={query}
      />
      
      {/* 검색 결과 섹션 */}
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
    </div>
  )
}

 
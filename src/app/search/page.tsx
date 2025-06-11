import { Suspense } from 'react'
import { Metadata } from 'next'
import { searchContent, searchTeams } from '@/domains/search/actions'
import { SearchBar, PostSearchResults, CommentSearchResults, TeamSearchResults } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult } from '@/domains/search/types'
import type { TeamSearchResult } from '@/domains/search/actions/searchTeams'

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
      // 게시글/댓글 검색
      if (type !== 'teams') {
        const data = await searchContent({
          query: query.trim(),
          type: type === 'all' ? 'all' : type,
          sortBy: sort,
          limit: 20
        })
        
        posts = data.posts
        comments = data.comments
      }
      
      // 팀 검색
      if (type === 'all' || type === 'teams') {
        const teamData = await searchTeams({
          query: query.trim(),
          limit: 20
        })
        teams = teamData.teams
      }
    } catch (error) {
      console.error('초기 검색 오류:', error)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h1 className="text-lg font-medium text-gray-900">검색</h1>
          <p className="mt-1 text-sm text-gray-500">게시글, 댓글, 팀 정보를 검색해보세요</p>
        </div>
        
        <div className="p-6">
          <SearchBar 
            initialQuery={query}
            placeholder="게시글, 댓글, 팀 검색..."
            className="mb-6"
          />
          
          {/* 검색 타입 탭 */}
          <SearchTabs currentType={type} query={query} />
          
          {/* 검색어가 없을 때 - 검색 안내 */}
          {!query && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                팀, 게시글, 댓글을 검색해보세요
              </div>
              <div className="text-gray-400 text-sm space-y-1">
                <p>팀 검색: 팀명, 도시명, 코드로 검색 가능</p>
                <p>예시: &ldquo;맨체스터&rdquo;, &ldquo;바르셀로나&rdquo;, &ldquo;MUN&rdquo;, &ldquo;런던&rdquo;</p>
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
            <Suspense fallback={<SearchSkeleton type="팀" />}>
              <div className="mb-6">
                <TeamSearchResults 
                  teams={teams}
                  total={teams.length}
                  hasMore={false}
                />
              </div>
            </Suspense>
          )}
          
          {/* 게시글 검색 결과 */}
          {(type === 'all' || type === 'posts') && posts.length > 0 && (
            <Suspense fallback={<SearchSkeleton type="게시글" />}>
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
            <Suspense fallback={<SearchSkeleton type="댓글" />}>
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

// 검색 타입 탭 컴포넌트
function SearchTabs({ currentType, query }: { currentType: string, query: string }) {
  const tabs = [
    { key: 'all', label: '전체' },
    { key: 'teams', label: '팀' },
    { key: 'posts', label: '게시글' },
    { key: 'comments', label: '댓글' },
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentType === tab.key
          const href = query 
            ? `/search?q=${encodeURIComponent(query)}&type=${tab.key}`
            : `/search?type=${tab.key}`
          
          return (
            <a
              key={tab.key}
              href={href}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                transition-colors duration-200
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

// 로딩 스켈레톤
function SearchSkeleton({ type }: { type: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="mt-2 text-gray-500">{type} 로딩 중...</p>
    </div>
  )
}

 
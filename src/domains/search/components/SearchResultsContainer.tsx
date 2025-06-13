'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PostSearchResults, CommentSearchResults, TeamSearchResults } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult, TeamSearchResult } from '@/domains/search/types'

interface SearchResultsContainerProps {
  query: string
  type: 'all' | 'posts' | 'comments' | 'teams'
  sort: 'latest' | 'views' | 'likes'
  page: number
  posts: PostSearchResult[]
  comments: CommentSearchResult[]
  teams: TeamSearchResult[]
  pagination: {
    posts: { total: number; hasMore: boolean }
    comments: { total: number; hasMore: boolean }
    teams: { total: number; hasMore: boolean }
  }
  className?: string
}

export default function SearchResultsContainer({
  query,
  type,
  sort,
  page,
  posts,
  comments,
  teams,
  pagination,
  className = ""
}: SearchResultsContainerProps) {
  const router = useRouter()
  const [isChangingTab, setIsChangingTab] = useState(false)
  const [currentTabUI, setCurrentTabUI] = useState<'all' | 'posts' | 'comments' | 'teams'>(type)

  // type이 변경되면 상태 업데이트
  useEffect(() => {
    setCurrentTabUI(type)
    setIsChangingTab(false)
  }, [type])

  // 검색 타입 탭 데이터 (전체 개수 표시)
  const searchTabs = [
    { 
      key: 'all' as const, 
      label: '전체', 
      count: pagination.posts.total + pagination.comments.total + pagination.teams.total 
    },
    { key: 'teams' as const, label: '팀', count: pagination.teams.total },
    { key: 'posts' as const, label: '게시글', count: pagination.posts.total },
    { key: 'comments' as const, label: '댓글', count: pagination.comments.total },
  ]

  const hasResults = posts.length > 0 || comments.length > 0 || teams.length > 0

  // 검색 결과 순서 결정 (팀 -> 게시글 -> 댓글)
  const resultSections = []
  
  // 팀 검색 결과
  if (query && (type === 'all' || type === 'teams') && teams.length > 0) {
    resultSections.push({
      key: 'teams',
      component: (
        <Suspense fallback={
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">팀 정보 로딩 중...</p>
          </div>
        }>
          <TeamSearchResults 
            teams={teams}
            hasMore={false}
            showMoreButton={type === 'all'}
            currentType={type}
            query={query}
            totalCount={pagination.teams.total}
          />
        </Suspense>
      )
    })
  }
  
  // 게시글 검색 결과
  if (query && (type === 'all' || type === 'posts') && posts.length > 0) {
    resultSections.push({
      key: 'posts',
      component: (
        <Suspense fallback={
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">게시글 로딩 중...</p>
          </div>
        }>
          <PostSearchResults 
            posts={posts}
            query={query}
            pagination={type === 'posts' ? {
              currentPage: page,
              totalItems: pagination.posts.total,
              itemsPerPage: 20,
              sort
            } : {
              currentPage: 1,
              totalItems: pagination.posts.total,
              itemsPerPage: 5,
              sort
            }}
            showMoreButton={type === 'all'}
            currentType={type}
          />
        </Suspense>
      )
    })
  }
  
  // 댓글 검색 결과
  if (query && (type === 'all' || type === 'comments') && comments.length > 0) {
    resultSections.push({
      key: 'comments',
      component: (
        <Suspense fallback={
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">댓글 로딩 중...</p>
          </div>
        }>
          <CommentSearchResults 
            comments={comments}
            query={query}
            pagination={type === 'comments' ? {
              currentPage: page,
              totalItems: pagination.comments.total,
              itemsPerPage: 20,
              sort
            } : {
              currentPage: 1,
              totalItems: pagination.comments.total,
              itemsPerPage: 5,
              sort
            }}
            showMoreButton={type === 'all'}
            currentType={type}
          />
        </Suspense>
      )
    })
  }

  // 탭 클릭 핸들러
  const handleTabClick = (tabKey: string, href: string) => {
    const validTabKey = tabKey as 'all' | 'posts' | 'comments' | 'teams'
    if (validTabKey === currentTabUI || isChangingTab) return
    
    setCurrentTabUI(validTabKey)
    setIsChangingTab(true)
    router.push(href)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 검색어가 있을 때 항상 네비게이션 탭 표시 */}
      {query && (
        <div className="mb-4">
          <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
            {searchTabs.map((tab) => {
              const isActive = currentTabUI === tab.key
              const href = `/search?q=${encodeURIComponent(query)}&type=${tab.key}${sort !== 'latest' ? `&sort=${sort}` : ''}`
              
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key, href)}
                  className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap transition-colors text-center ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  disabled={isChangingTab}
                >
                  {tab.label} ({tab.count.toLocaleString()})
                  {isChangingTab && isActive && (
                    <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-blue-200"></span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 검색 결과가 없을 때 */}
      {query && !hasResults && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-gray-500 text-lg mb-2">
              &lsquo;<span className="font-medium text-gray-700">{query}</span>&rsquo;에 대한 검색 결과가 없습니다
            </div>
            <div className="text-gray-400 text-sm">
              다른 검색어를 시도해보세요
            </div>
          </div>
        </div>
      )}
      
      {/* 검색어가 없을 때 */}
      {!query && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="text-gray-500 text-lg mb-2">
              검색어를 입력해주세요
            </div>
            <div className="text-gray-400 text-sm">
              게시글, 댓글, 팀 정보를 검색할 수 있습니다
            </div>
          </div>
        </div>
      )}
      
      {/* 각 검색 결과 섹션들 (별도 테이블로 분리) */}
      {resultSections.map((section) => (
        <div key={section.key} className="bg-white rounded-lg border shadow-sm">
          {section.component}
        </div>
      ))}
    </div>
  )
} 
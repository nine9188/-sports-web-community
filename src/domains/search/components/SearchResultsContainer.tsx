'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PostSearchResults, CommentSearchResults, TeamSearchResults } from '@/domains/search'
import type { PostSearchResult, CommentSearchResult, TeamSearchResult } from '@/domains/search/types'
import { TabList, type TabItem, Pagination } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner';

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
  const searchTabs: TabItem[] = [
    { 
      id: 'all', 
      label: '전체', 
      count: pagination.posts.total + pagination.comments.total + pagination.teams.total 
    },
    { id: 'teams', label: '팀', count: pagination.teams.total },
    { id: 'posts', label: '게시글', count: pagination.posts.total },
    { id: 'comments', label: '댓글', count: pagination.comments.total },
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
            <Spinner size="lg" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">팀 정보 로딩 중...</p>
          </div>
        }>
          <TeamSearchResults 
            teams={teams}
            hasMore={false}
            showMoreButton={type === 'all'}
            currentType={type}
            query={query}
            totalCount={pagination.teams.total}
            pagination={type === 'teams' ? {
              currentPage: page,
              totalItems: pagination.teams.total,
              itemsPerPage: 20
            } : undefined}
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
            <Spinner size="lg" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">게시글 로딩 중...</p>
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
            <Spinner size="lg" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">댓글 로딩 중...</p>
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
  const handleTabClick = (tabKey: string) => {
    const validTabKey = tabKey as 'all' | 'posts' | 'comments' | 'teams'
    if (validTabKey === currentTabUI || isChangingTab) return
    
    setCurrentTabUI(validTabKey)
    setIsChangingTab(true)
    const href = `/search?q=${encodeURIComponent(query)}&type=${tabKey}${sort !== 'latest' ? `&sort=${sort}` : ''}`
    router.push(href)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 검색어가 있을 때 항상 네비게이션 탭 표시 */}
      {query && (
        <TabList
          tabs={searchTabs}
          activeTab={currentTabUI}
          onTabChange={handleTabClick}
          isChangingTab={isChangingTab}
          showCount={true}
        />
      )}

      {/* 검색 결과가 없을 때 */}
      {query && !hasResults && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              &lsquo;<span className="font-medium text-gray-700 dark:text-gray-300">{query}</span>&rsquo;에 대한 검색 결과가 없습니다
            </div>
            <div className="text-gray-400 text-sm">
              다른 검색어를 시도해보세요
            </div>
          </div>
        </div>
      )}
      
      {/* 검색어가 없을 때 */}
      {!query && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
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
        <div key={section.key} className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
          {section.component}
        </div>
      ))}

      {/* 카드 목록 하단 공통 페이지네이션 (posts/comments 전용) */}
      {query && type === 'posts' && pagination.posts.total > 20 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(pagination.posts.total / 20)}
          mode="url"
          withMargin={false}
        />
      )}

      {query && type === 'comments' && pagination.comments.total > 20 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(pagination.comments.total / 20)}
          mode="url"
          withMargin={false}
        />
      )}

      {query && type === 'teams' && pagination.teams.total > 20 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(pagination.teams.total / 20)}
          mode="url"
          withMargin={false}
        />
      )}
    </div>
  )
} 
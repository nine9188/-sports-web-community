'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CommentSearchResults, PostSearchResults, TeamSearchResults } from '@/domains/search'
import type { CommentSearchResult, PostSearchResult, TeamSearchResult } from '@/domains/search/types'
import { TabList, type TabItem } from '@/shared/components/ui'
import SearchPagination from './SearchPagination'
import AdBanner from '@/shared/components/AdBanner'

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
  className = '',
}: SearchResultsContainerProps) {
  const router = useRouter()
  const [isChangingTab, setIsChangingTab] = useState(false)
  const [currentTabUI, setCurrentTabUI] = useState<'all' | 'posts' | 'comments' | 'teams'>(type)

  useEffect(() => {
    setCurrentTabUI(type)
    setIsChangingTab(false)
  }, [type])

  const searchTabs: TabItem[] = [
    { id: 'all', label: '전체', count: pagination.posts.total + pagination.comments.total + pagination.teams.total },
    { id: 'teams', label: '팀', count: pagination.teams.total },
    { id: 'posts', label: '게시글', count: pagination.posts.total },
    { id: 'comments', label: '댓글', count: pagination.comments.total },
  ]

  const hasResults = posts.length > 0 || comments.length > 0 || teams.length > 0

  const handleTabClick = (tabKey: string) => {
    const validTabKey = tabKey as 'all' | 'posts' | 'comments' | 'teams'
    if (validTabKey === currentTabUI || isChangingTab) return

    setCurrentTabUI(validTabKey)
    setIsChangingTab(true)
    const href = `/search?q=${encodeURIComponent(query)}&type=${tabKey}${sort !== 'latest' ? `&sort=${sort}` : ''}`
    router.push(href)
  }

  const resultSections: Array<{ key: string; component: React.ReactNode }> = []

  if (query && (type === 'all' || type === 'teams') && teams.length > 0) {
    resultSections.push({
      key: 'teams',
      component: (
        <TeamSearchResults
          teams={teams}
          hasMore={false}
          showMoreButton={type === 'all'}
          currentType={type}
          query={query}
          totalCount={pagination.teams.total}
          pagination={type === 'teams'
            ? {
                currentPage: page,
                totalItems: pagination.teams.total,
                itemsPerPage: 20,
              }
            : undefined}
        />
      ),
    })
  }

  if (query && (type === 'all' || type === 'posts') && posts.length > 0) {
    resultSections.push({
      key: 'posts',
      component: (
        <PostSearchResults
          posts={posts}
          query={query}
          pagination={type === 'posts'
            ? {
                currentPage: page,
                totalItems: pagination.posts.total,
                itemsPerPage: 20,
                sort,
              }
            : {
                currentPage: 1,
                totalItems: pagination.posts.total,
                itemsPerPage: 5,
                sort,
              }}
          showMoreButton={type === 'all'}
          currentType={type}
        />
      ),
    })
  }

  if (query && (type === 'all' || type === 'comments') && comments.length > 0) {
    resultSections.push({
      key: 'comments',
      component: (
        <CommentSearchResults
          comments={comments}
          query={query}
          pagination={type === 'comments'
            ? {
                currentPage: page,
                totalItems: pagination.comments.total,
                itemsPerPage: 20,
                sort,
              }
            : {
                currentPage: 1,
                totalItems: pagination.comments.total,
                itemsPerPage: 5,
                sort,
              }}
          showMoreButton={type === 'all'}
          currentType={type}
        />
      ),
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {query && (
        <TabList
          tabs={searchTabs}
          activeTab={currentTabUI}
          onTabChange={handleTabClick}
          isChangingTab={isChangingTab}
          showCount
        />
      )}

      {query && <AdBanner />}

      {query && !hasResults && (
        <div className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              &lsquo;<span className="font-medium text-gray-700 dark:text-gray-300">{query}</span>&rsquo;에 대한 검색 결과가 없습니다
            </div>
            <div className="text-gray-400 text-[13px]">다른 검색어를 시도해보세요</div>
          </div>
        </div>
      )}

      {!query && (
        <div className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">검색어를 입력해주세요</div>
            <div className="text-gray-400 text-[13px]">게시글, 댓글, 팀 정보를 검색할 수 있습니다</div>
          </div>
        </div>
      )}

      {resultSections.map((section) => (
        <div key={section.key} className="bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
          {section.component}
        </div>
      ))}

      {type === 'posts' && (
        <SearchPagination
          query={query}
          type="posts"
          currentPage={page}
          totalItems={pagination.posts.total}
          itemsPerPage={20}
        />
      )}

      {type === 'comments' && (
        <SearchPagination
          query={query}
          type="comments"
          currentPage={page}
          totalItems={pagination.comments.total}
          itemsPerPage={20}
        />
      )}

      {type === 'teams' && (
        <SearchPagination
          query={query}
          type="teams"
          currentPage={page}
          totalItems={pagination.teams.total}
          itemsPerPage={20}
        />
      )}
    </div>
  )
}

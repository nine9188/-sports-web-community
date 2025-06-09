import { Suspense } from 'react'
import { Metadata } from 'next'
import { searchContent } from '@/domains/search/actions'
import type { SearchResponse } from '@/domains/search/types'
import SearchPageClient from './SearchPageClient'

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
  let initialData: SearchResponse = { posts: [], comments: [], totalCount: 0 }
  
  if (query.trim()) {
    try {
      initialData = await searchContent({
        query: query.trim(),
        type,
        sortBy: sort,
        limit: 20
      })
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
        
        <Suspense fallback={
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        }>
          <SearchPageClient 
            initialQuery={query}
            initialType={type}
            initialSort={sort}
            initialData={initialData}
          />
        </Suspense>
      </div>
    </div>
  )
}

 
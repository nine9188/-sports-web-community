import { Suspense } from 'react'
import { Metadata } from 'next'
import SearchPageContent from '@/domains/search/components/SearchPageContent'

export const metadata: Metadata = {
  title: '검색 - 축구 커뮤니티',
  description: '게시글, 뉴스, 팀 정보를 통합 검색하세요',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h1 className="text-lg font-medium text-gray-900">검색</h1>
          <p className="mt-1 text-sm text-gray-500">게시글을 검색해보세요</p>
        </div>
        
        <Suspense fallback={
          <div className="p-6 text-center">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        }>
          <SearchPageContent 
            initialQuery={params.q || ''}
            initialSort={params.sort || 'latest'}
            initialPage={parseInt(params.page || '1')}
          />
        </Suspense>
      </div>
    </div>
  )
}

 
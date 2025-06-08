'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
// SVG 아이콘을 직접 사용
import UserIcon from '@/shared/components/UserIcon'
import type { SearchResult } from '../types'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  isLoading?: boolean
  totalResults?: number
}

export default function SearchResults({ 
  results, 
  query, 
  isLoading = false,
  totalResults 
}: SearchResultsProps) {
  if (isLoading) {
    return <SearchResultsSkeleton />
  }

  if (!results.length && query) {
    return <EmptySearchResults query={query} />
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* 검색 결과 헤더 */}
      {query && (
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900">
            &ldquo;<span className="text-blue-600">{query}</span>&rdquo; 검색 결과
          </h2>
          {totalResults !== undefined && (
            <span className="text-sm text-gray-500">
              총 {totalResults.toLocaleString()}개
            </span>
          )}
        </div>
      )}

      {/* 검색 결과 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-7/12">
                제목
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                게시판
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/12">
                작성자
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/12">
                조회
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                작성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <SearchResultRow key={result.id} result={result} query={query} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SearchResultRowProps {
  result: SearchResult
  query: string
}

function SearchResultRow({ result, query }: SearchResultRowProps) {
  const { metadata } = result

  // 검색어 하이라이트 함수
  const highlightQuery = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text
    
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ko 
      })
    } catch {
      return dateString
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link href={result.url} className="block">
          <div className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
            {highlightQuery(result.title, query)}
          </div>
          {result.content && (
            <div className="text-gray-600 text-xs mt-1 line-clamp-1">
              {highlightQuery(result.content, query)}
            </div>
          )}
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        {metadata.boardName && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {metadata.boardName}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
        {metadata.author && (
          <div className="flex items-center space-x-1">
            <UserIcon 
              iconUrl={null}
              level={1}
              size={16}
              className="w-4 h-4"
            />
            <span>{metadata.author}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
        {metadata.views !== undefined ? metadata.views.toLocaleString() : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
        {formatDate(metadata.createdAt)}
      </td>
    </tr>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-7/12">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                게시판
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/12">
                작성자
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/12">
                조회
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                작성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptySearchResults({ query }: { query: string }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h2 className="text-base font-medium text-gray-900">
          &ldquo;<span className="text-blue-600">{query}</span>&rdquo; 검색 결과
        </h2>
      </div>
      
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          검색 결과가 없습니다
        </h3>
        <p className="mt-2 text-gray-500">
          &ldquo;<span className="font-medium">{query}</span>&rdquo;에 대한 검색 결과를 찾을 수 없습니다.
        </p>
        <div className="mt-4 text-sm text-gray-400">
          <p>다른 검색어를 시도해보세요:</p>
          <ul className="mt-2 space-y-1">
            <li>• 더 간단한 단어로 검색해보세요</li>
            <li>• 맞춤법을 확인해보세요</li>
            <li>• 다른 키워드를 사용해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 
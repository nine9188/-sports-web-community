'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
// SVG 아이콘을 직접 사용
import UserIcon from '@/shared/components/UserIcon'
import type { PostSearchResult, CommentSearchResult } from '../types'

// 🔧 통합 검색 결과 타입 정의
type SearchResultItem = PostSearchResult | CommentSearchResult

interface SearchResultsProps {
  results: SearchResultItem[]
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
  result: SearchResultItem
  query: string
}

function SearchResultRow({ result, query }: SearchResultRowProps) {
  // 🔧 타입 가드를 사용하여 PostSearchResult인지 CommentSearchResult인지 구분
  const isPost = 'title' in result && 'post_number' in result
  const isComment = 'post_id' in result && !('post_number' in result)

  // 🔧 공통 데이터 추출
  const getResultData = () => {
    if (isPost) {
      const post = result as PostSearchResult
      return {
        title: post.title,
        content: post.snippet || '',
        url: `/boards/${post.boards?.slug || 'unknown'}/${post.post_number}`,
        author: post.author_name || post.profiles?.nickname || '익명',
        boardName: post.board_name || post.boards?.name || '게시판',
        views: post.views || 0,
        createdAt: post.created_at,
        type: 'post' as const
      }
    } else if (isComment) {
      const comment = result as CommentSearchResult
      return {
        title: comment.post_title || comment.posts?.title || '댓글',
        content: comment.snippet || '',
        url: `/boards/${comment.posts?.boards?.slug || 'unknown'}/${comment.posts?.post_number || 0}#comment-${comment.id}`,
        author: comment.author_name || comment.profiles?.nickname || '익명',
        boardName: comment.board_name || comment.posts?.boards?.name || '게시판',
        views: 0, // 댓글은 조회수 없음
        createdAt: comment.created_at,
        type: 'comment' as const
      }
    }
    
    // 기본값
    return {
      title: '제목 없음',
      content: '',
      url: '#',
      author: '익명',
      boardName: '게시판',
      views: 0,
      createdAt: null,
      type: 'post' as const
    }
  }

  const data = getResultData()

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
  const formatDate = (dateString?: string | null) => {
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
        <Link href={data.url} className="block">
          <div className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
            {data.type === 'comment' && (
              <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded mr-2">
                댓글
              </span>
            )}
            {highlightQuery(data.title, query)}
          </div>
          {data.content && (
            <div className="text-gray-600 text-xs mt-1 line-clamp-1">
              {highlightQuery(data.content, query)}
            </div>
          )}
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
        {data.boardName && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {data.boardName}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
        {data.author && (
          <div className="flex items-center space-x-1">
            <UserIcon 
              iconUrl={null}
              level={1}
              size={16}
              className="w-4 h-4"
            />
            <span>{data.author}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
        {data.type === 'post' ? (data.views ? data.views.toLocaleString() : '-') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
        {formatDate(data.createdAt)}
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
'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CardPreview, PostSearchResult } from '../types'
import { trackSearchResultClick } from '../actions/searchLogs'
import { formatDate } from '@/shared/utils/dateUtils'

interface PostSearchResultsProps {
  posts: PostSearchResult[]
  query: string
  isLoading?: boolean
  pagination?: {
    currentPage: number
    totalItems: number
    itemsPerPage: number
    sort: 'latest' | 'views' | 'likes'
  }
  showMoreButton?: boolean
  currentType?: 'all' | 'posts' | 'comments' | 'teams'
}

export default function PostSearchResults({
  posts,
  query,
  isLoading = false,
  pagination,
  showMoreButton = false,
  currentType = 'posts'
}: PostSearchResultsProps) {
  const handlePostClick = async (post: PostSearchResult) => {
    try {
      await trackSearchResultClick({
        search_query: query,
        clicked_result_id: post.id,
        clicked_result_type: 'post'
      })
    } catch (error) {
      console.error('게시글 클릭 추적 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
        불러오는 중...
      </div>
    )
  }

  if (!posts.length && query) {
    return (
      <div className="text-center py-8 text-gray-500 text-[13px]">
        게시글 검색 결과가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          게시글 ({pagination?.totalItems || posts.length}개)
        </h3>
      </div>

      <div className="divide-y divide-black/5 dark:divide-white/10">
        {posts.map((post) => (
          <div key={post.id} className="p-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
            <Link
              href={`/boards/${post.boards?.slug || 'unknown'}/${post.post_number}`}
              className="block"
              prefetch={false}
              onClick={() => handlePostClick(post)}
            >
              <div className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 transition-colors">
                {highlightQuery(post.title, query)}
              </div>

              {post.snippet && (
                <div className="text-gray-700 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                  {highlightQuery(post.snippet, query)}
                </div>
              )}

              {post.cards && post.cards.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.cards.map((card, i) => (
                    <CardPreviewBadge key={i} card={card} />
                  ))}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-6 items-center rounded-full border border-black/7 bg-[#FAFAFA] px-2.5 text-[11px] font-medium text-gray-600 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <span>{post.author_name || post.profiles?.nickname || '익명'}</span>
                  {(post.board_name || post.boards?.name) && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {post.board_name || post.boards?.name}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span>조회 {post.views ? post.views.toLocaleString() : '0'}</span>
                  <span>좋아요 {post.likes || 0}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {pagination && currentType === 'posts' && (
        <PaginationSummary pagination={pagination} />
      )}

      {showMoreButton && currentType === 'all' && posts.length >= 5 && (
        <div className="px-4 py-3 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <Link
            href={`/search?q=${encodeURIComponent(query)}&type=posts`}
            className="text-[13px] text-gray-900 dark:text-[#F0F0F0] hover:underline font-medium transition-colors"
          prefetch={false}
          >
            더 많은 게시글 보기 ({pagination?.totalItems || 0}개)
          </Link>
        </div>
      )}
    </div>
  )
}

function PaginationSummary({
  pagination
}: {
  pagination: NonNullable<PostSearchResultsProps['pagination']>
}) {
  const start = (pagination.currentPage - 1) * pagination.itemsPerPage + 1
  const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)

  return (
    <div className="px-4 sm:px-6 py-3 border-t border-black/7 dark:border-white/10">
      <p className="text-[13px] text-gray-700 dark:text-gray-300">
        총 <span className="font-medium">{pagination.totalItems}</span>개 중{' '}
        <span className="font-medium">{start}</span>-
        <span className="font-medium">{end}</span>개 표시
      </p>
    </div>
  )
}

function highlightQuery(text: string, searchQuery: string) {
  if (!searchQuery.trim()) return text

  const escapedQuery = escapeRegExp(searchQuery.trim())
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function CardPreviewBadge({ card }: { card: CardPreview }) {
  if (card.type === 'match') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-md text-xs text-gray-700 dark:text-gray-300">
        <span className="font-medium">{card.homeTeam}</span>
        <span className="text-gray-500 dark:text-gray-400">{card.homeScore} - {card.awayScore}</span>
        <span className="font-medium">{card.awayTeam}</span>
        {card.leagueName && (
          <span className="text-gray-400 dark:text-gray-500 ml-0.5">· {card.leagueName}</span>
        )}
      </span>
    )
  }

  if (card.type === 'team') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-md text-xs text-gray-700 dark:text-gray-300">
        {card.teamLogo && (
          <Image src={card.teamLogo} alt={`${card.teamName} 로고`} width={16} height={16} unoptimized className="w-4 h-4 object-contain" />
        )}
        <span className="font-medium">{card.teamName}</span>
      </span>
    )
  }

  if (card.type === 'player') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F5] dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-md text-xs text-gray-700 dark:text-gray-300">
        {card.playerPhoto && (
          <Image src={card.playerPhoto} alt={`${card.playerName} 사진`} width={16} height={16} unoptimized className="w-4 h-4 rounded-full object-cover" />
        )}
        <span className="font-medium">{card.playerName}</span>
      </span>
    )
  }

  return null
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { renderContentTypeIcons } from '../post/postlist/components/shared/PostRenderers';
import { skeletonText } from '@/shared/styles';

interface PopularPost {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
  post_number: number;
  likes: number;
  views: number;
  comment_count: number;
  author_nickname: string;
  author_id?: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  created_at: string;
  formattedDate?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  content?: string;
}

interface BoardPopularPostsProps {
  todayPosts: PopularPost[];
  weekPosts: PopularPost[];
  className?: string;
  isLoading?: boolean;
}

export default function BoardPopularPosts({
  todayPosts,
  weekPosts,
  className = '',
  isLoading = false,
}: BoardPopularPostsProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  const currentPosts = activeTab === 'today' ? todayPosts : weekPosts;
  const tabLabel = activeTab === 'today' ? '오늘 BEST' : '이번주 BEST';

  // 스켈레톤 행 렌더링
  const renderSkeletonRows = () => {
    return Array(4).fill(0).map((_, i) => (
      <tr
        key={`skeleton-${i}`}
        className={i !== 3 ? 'border-b border-black/5 dark:border-white/10' : ''}
      >
        <td className="py-1.5 px-3 align-middle w-6">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-none">
            {i + 1}
          </span>
        </td>
        <td className="py-1.5 pr-3 align-middle">
          <div className={`${skeletonText} h-3 w-full max-w-[200px]`} />
        </td>
      </tr>
    ));
  };

  const renderTableRows = (posts: PopularPost[]) => {
    const displayedPosts = posts.slice(0, 4);
    const rows = [];

    // 항상 4개의 행을 렌더링
    for (let i = 0; i < 4; i++) {
      const post = displayedPosts[i];
      const isLast = i === 3;

      if (post) {
        rows.push(
          <tr
            key={post.id}
            className={`hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
              !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
            }`}
          >
            <td className="py-1.5 px-3 align-middle w-6">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-none">
                {i + 1}
              </span>
            </td>
            <td className="py-1.5 pr-3 align-middle max-w-0">
              <Link href={`/boards/${post.board_slug}/${post.post_number}`} className="block w-full overflow-hidden" prefetch={false}>
                <div className="flex items-center gap-1">
                  <span className="text-xs truncate text-gray-900 dark:text-[#F0F0F0]">
                    {post.title}
                  </span>
                  {renderContentTypeIcons(post)}
                  {post.comment_count > 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 flex-shrink-0 whitespace-nowrap">
                      [{post.comment_count}]
                    </span>
                  )}
                </div>
              </Link>
            </td>
          </tr>
        );
      } else {
        // 빈 행 렌더링
        rows.push(
          <tr
            key={`empty-${i}`}
            className={!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}
          >
            <td className="py-1.5 px-3 align-middle w-6">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-none">
                {i + 1}
              </span>
            </td>
            <td className="py-1.5 pr-3 align-middle">
              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            </td>
          </tr>
        );
      }
    }

    return rows;
  };

  return (
    <div className={className}>
      {/* 모바일 UI - 탭 전환 */}
      <div className="md:hidden border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{tabLabel}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {activeTab === 'today' ? '1' : '2'} / 2
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab(activeTab === 'today' ? 'week' : 'today')}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label={activeTab === 'today' ? '이번주 BEST' : '오늘 BEST'}
            >
              {activeTab === 'today' ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {isLoading ? renderSkeletonRows() : renderTableRows(currentPosts)}
          </tbody>
        </table>
      </div>

      {/* PC UI */}
      <div className="hidden md:block border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="grid grid-cols-2">
          {/* 오늘 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
              <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">오늘 BEST</h3>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {isLoading ? renderSkeletonRows() : renderTableRows(todayPosts)}
              </tbody>
            </table>
          </div>

          {/* 이번주 BEST */}
          <div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
              <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">이번주 BEST</h3>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {isLoading ? renderSkeletonRows() : renderTableRows(weekPosts)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

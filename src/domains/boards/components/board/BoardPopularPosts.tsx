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
import type { PopularPost } from '@/domains/boards/types/post';

interface BoardPopularPostsProps {
  weekPosts: PopularPost[];
  monthPosts: PopularPost[];
  className?: string;
  isLoading?: boolean;
}

const ROW_CLS = 'flex items-center py-3 md:py-1.5';
const BORDER_CLS = 'border-b border-black/5 dark:border-white/10';
const NUM_CLS = 'w-10 flex-shrink-0 px-3 text-xs font-bold text-gray-500 dark:text-gray-400';

function LoadingRows() {
  return (
    <>
      {Array(4).fill(0).map((_, i) => (
        <div key={`sk-${i}`} className={`${ROW_CLS} ${i !== 3 ? BORDER_CLS : ''}`}>
          <span className={NUM_CLS}>{i + 1}</span>
          {i === 0 ? (
            <span className="text-[13px] text-gray-500 dark:text-gray-400 pr-3">불러오는 중...</span>
          ) : (
            <span className="text-[13px] text-gray-400 dark:text-gray-500 pr-3">-</span>
          )}
        </div>
      ))}
    </>
  );
}

function PostRows({ posts }: { posts: PopularPost[] }) {
  const displayed = posts.slice(0, 4);

  return (
    <>
      {Array(4).fill(0).map((_, i) => {
        const post = displayed[i];
        const isLast = i === 3;

        if (post) {
          return (
            <div
              key={post.id}
              className={`${ROW_CLS} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${!isLast ? BORDER_CLS : ''}`}
            >
              <span className={NUM_CLS}>{i + 1}</span>
              <Link
                href={`/boards/${post.board_slug}/${post.post_number}`}
                className="flex-1 flex items-center gap-1 pr-3 min-w-0 overflow-hidden"
                prefetch={false}
              >
                <span className="text-[13px] truncate text-gray-900 dark:text-[#F0F0F0]">
                  {post.title}
                </span>
                {renderContentTypeIcons(post as { content?: string })}
                {post.comment_count > 0 && (
                  <span className="text-[13px] text-orange-600 dark:text-orange-400 flex-shrink-0 whitespace-nowrap">
                    [{post.comment_count}]
                  </span>
                )}
              </Link>
            </div>
          );
        }

        return (
          <div key={`empty-${i}`} className={`${ROW_CLS} ${!isLast ? BORDER_CLS : ''}`}>
            <span className={NUM_CLS}>{i + 1}</span>
            <span className="text-[13px] text-gray-400 dark:text-gray-500 pr-3">-</span>
          </div>
        );
      })}
    </>
  );
}

export default function BoardPopularPosts({
  weekPosts,
  monthPosts,
  className = '',
  isLoading = false,
}: BoardPopularPostsProps) {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');

  const currentPosts = activeTab === 'week' ? weekPosts : monthPosts;
  const tabLabel = activeTab === 'week' ? '이번주 BEST' : '이번달 BEST';

  return (
    <div className={className}>
      {/* 모바일 UI */}
      <div className="md:hidden border border-black/7 dark:border-0 overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">{tabLabel}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {activeTab === 'week' ? '1' : '2'} / 2
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab(activeTab === 'week' ? 'month' : 'week')}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label={activeTab === 'week' ? '이번달 BEST' : '이번주 BEST'}
            >
              {activeTab === 'week' ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-col">
          {isLoading ? <LoadingRows /> : <PostRows posts={currentPosts} />}
        </div>
      </div>

      {/* PC UI */}
      <div className="hidden md:block border border-black/7 dark:border-0 md:rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="grid grid-cols-2">
          {/* 이번주 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
              <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">이번주 BEST</h3>
            </div>
            <div className="flex flex-col">
              {isLoading ? <LoadingRows /> : <PostRows posts={weekPosts} />}
            </div>
          </div>

          {/* 이번달 BEST */}
          <div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
              <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">이번달 BEST</h3>
            </div>
            <div className="flex flex-col">
              {isLoading ? <LoadingRows /> : <PostRows posts={monthPosts} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

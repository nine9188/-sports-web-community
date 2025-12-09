'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

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
}

interface BoardPopularPostsProps {
  todayPosts: PopularPost[];
  weekPosts: PopularPost[];
  className?: string;
}

export default function BoardPopularPosts({
  todayPosts,
  weekPosts,
  className = ''
}: BoardPopularPostsProps) {
  const renderBoardLogo = (post: PopularPost) => {
    if (post.team_id || post.league_id) {
      return (
        <div className="flex items-center justify-center">
          <div className="relative w-5 h-5">
            <ApiSportsImage
              imageId={post.team_id || post.league_id || 0}
              imageType={post.team_id ? ImageType.Teams : ImageType.Leagues}
              alt={post.board_name}
              width={20}
              height={20}
              className="object-contain w-5 h-5"
              loading="lazy"
              priority={false}
            />
          </div>
        </div>
      );
    } else {
      return (
        <span className="inline-block text-xs bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full truncate"
              title={post.board_name}
              style={{maxWidth: '90px'}}>
          {post.board_name}
        </span>
      );
    }
  };

  const renderTableRows = (posts: PopularPost[]) => {
    if (posts.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            인기 게시글이 없습니다
          </td>
        </tr>
      );
    }

    return posts.slice(0, 4).map((post, index) => {
      return (
        <tr
          key={post.id}
          className="border-b border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
        >
          <td className="py-2 px-2 align-middle">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {index + 1}
              </span>
              {renderBoardLogo(post)}
            </div>
          </td>
          <td className="py-2 px-4 align-middle">
            <Link href={`/boards/${post.board_slug}/${post.post_number}`} className="block w-full" prefetch={false}>
              <div className="flex items-center">
                <span className="text-xs line-clamp-1 text-gray-900 dark:text-[#F0F0F0]">
                  {post.title}
                </span>
                {post.comment_count > 0 && (
                  <span className="ml-1 text-xs text-orange-600 dark:text-orange-400 flex-shrink-0">
                    [{post.comment_count}]
                  </span>
                )}
              </div>
            </Link>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className={className}>
      {/* 모바일 UI */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {/* 오늘 BEST */}
        <div className="border border-black/7 dark:border-0 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
          <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
            <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">오늘 BEST</h3>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {renderTableRows(todayPosts)}
            </tbody>
          </table>
        </div>

        {/* 이번주 BEST */}
        <div className="border border-black/7 dark:border-0 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
          <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
            <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">이번주 BEST</h3>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {renderTableRows(weekPosts)}
            </tbody>
          </table>
        </div>
      </div>

      {/* PC UI */}
      <div className="hidden md:block border border-black/7 dark:border-0 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="grid grid-cols-2">
          {/* 오늘 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center border-b border-black/5 dark:border-white/10">
              <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">오늘 BEST</h3>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {renderTableRows(todayPosts)}
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
                {renderTableRows(weekPosts)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

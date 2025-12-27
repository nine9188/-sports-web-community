'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Video as VideoIcon,
  Youtube as YoutubeIcon,
  Link as LinkIcon,
  Trophy as MatchCardIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Linkedin as LinkedinIcon,
  Music2 as TiktokIcon,
} from 'lucide-react';
import { checkContentType } from '../post/postlist/utils';

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
}

export default function BoardPopularPosts({
  todayPosts,
  weekPosts,
  className = ''
}: BoardPopularPostsProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  const currentPosts = activeTab === 'today' ? todayPosts : weekPosts;
  const tabLabel = activeTab === 'today' ? '오늘 BEST' : '이번주 BEST';

  const renderContentIcons = (post: PopularPost) => {
    if (!post.content) return null;
    const {
      hasImage,
      hasVideo,
      hasYoutube,
      hasLink,
      hasMatchCard,
      hasTwitter,
      hasInstagram,
      hasFacebook,
      hasTiktok,
      hasLinkedin,
    } = checkContentType(post.content);

    const hasAnyIcon = hasImage || hasVideo || hasYoutube || hasLink || hasMatchCard ||
      hasTwitter || hasInstagram || hasFacebook || hasTiktok || hasLinkedin;
    if (!hasAnyIcon) return null;

    return (
      <div className="inline-flex items-center gap-0.5 flex-shrink-0">
        {hasMatchCard && <MatchCardIcon className="h-3 w-3 text-blue-500" />}
        {hasImage && <ImageIcon className="h-3 w-3 text-green-500" />}
        {hasVideo && <VideoIcon className="h-3 w-3 text-purple-500" />}
        {hasYoutube && <YoutubeIcon className="h-3 w-3 text-red-500" />}
        {hasTwitter && <TwitterIcon className="h-3 w-3 text-sky-500" />}
        {hasInstagram && <InstagramIcon className="h-3 w-3 text-pink-500" />}
        {hasFacebook && <FacebookIcon className="h-3 w-3 text-blue-600" />}
        {hasTiktok && <TiktokIcon className="h-3 w-3 text-black dark:text-white" />}
        {hasLinkedin && <LinkedinIcon className="h-3 w-3 text-blue-700" />}
        {hasLink && !hasMatchCard && <LinkIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />}
      </div>
    );
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

    const displayedPosts = posts.slice(0, 4);
    return displayedPosts.map((post, index) => {
      const isLast = index === displayedPosts.length - 1;
      return (
        <tr
          key={post.id}
          className={`hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
            !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
          }`}
        >
          <td className="py-1.5 px-3 align-middle w-6">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-none">
              {index + 1}
            </span>
          </td>
          <td className="py-1.5 pr-3 align-middle max-w-0">
            <Link href={`/boards/${post.board_slug}/${post.post_number}`} className="block w-full overflow-hidden" prefetch={false}>
              <div className="flex items-center gap-1">
                <span className="text-xs truncate text-gray-900 dark:text-[#F0F0F0]">
                  {post.title}
                </span>
                {renderContentIcons(post)}
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
    });
  };

  return (
    <div className={className}>
      {/* 모바일 UI - 탭 전환 */}
      <div className="md:hidden border border-black/7 dark:border-0 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0] mr-2" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{tabLabel}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {activeTab === 'today' ? '1' : '2'} / 2
            </span>
            <button
              onClick={() => setActiveTab(activeTab === 'today' ? 'week' : 'today')}
              className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-700 dark:text-gray-300"
              aria-label={activeTab === 'today' ? '이번주 BEST' : '오늘 BEST'}
            >
              {activeTab === 'today' ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {renderTableRows(currentPosts)}
          </tbody>
        </table>
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

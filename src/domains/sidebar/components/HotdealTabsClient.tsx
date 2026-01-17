'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Flame,
  Percent,
} from 'lucide-react';
import { formatPrice, getDiscountRate } from '@/domains/boards/utils/hotdeal';
import type { HotdealPostsData, HotdealTabType, HotdealSidebarPost } from '../types/hotdeal';

interface HotdealTabsClientProps {
  postsData: HotdealPostsData;
}

export function HotdealTabsClient({ postsData }: HotdealTabsClientProps) {
  const [activeTab, setActiveTab] = useState<HotdealTabType>('hot');

  // 현재 탭에 맞는 게시글 배열 가져오기
  const getCurrentPosts = (): HotdealSidebarPost[] => {
    return postsData[activeTab] || [];
  };

  // 탭에 따른 통계 표시
  const renderStats = (post: HotdealSidebarPost) => {
    const discountRate = getDiscountRate(
      post.deal_info.price,
      post.deal_info.original_price
    );

    if (activeTab === 'hot') {
      return (
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-0.5" />
            {post.views}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="h-3 w-3 mr-0.5" />
            {post.likes}
          </span>
        </div>
      );
    } else if (activeTab === 'discount') {
      return discountRate ? (
        <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">
          {discountRate}%↓
        </span>
      ) : null;
    } else if (activeTab === 'likes') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <ThumbsUp className="h-3 w-3 mr-0.5" />
          {post.likes}
        </span>
      );
    } else if (activeTab === 'comments') {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center">
          <MessageSquare className="h-3 w-3 mr-0.5" />
          {post.comment_count || 0}
        </span>
      );
    }
    return null;
  };

  const currentPosts = getCurrentPosts();

  return (
    <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
      {/* 헤더 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center border-b border-black/5 dark:border-white/10 rounded-t-lg">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">핫딜 베스트</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {postsData.windowDays ? `최근 ${postsData.windowDays}일 기준` : '최근 3일 기준'}
        </span>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-black/5 dark:border-white/10">
        {[
          { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3 mr-0.5" /> },
          { id: 'discount', label: '할인율', icon: <Percent className="h-3 w-3 mr-0.5" /> },
          { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3 mr-0.5" /> },
          { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3 mr-0.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HotdealTabType)}
            className={`flex-1 text-xs py-2 px-2 flex items-center justify-center transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 게시글 리스트 */}
      <div>
        {currentPosts.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            핫딜이 없습니다.
          </div>
        ) : (
          <ul>
            {currentPosts.map((post, index) => {
              const discountRate = getDiscountRate(
                post.deal_info.price,
                post.deal_info.original_price
              );

              return (
                <li
                  key={post.id}
                  className={
                    index < currentPosts.length - 1
                      ? 'border-b border-black/5 dark:border-white/10'
                      : ''
                  }
                >
                  <Link
                    href={`/boards/${post.board_slug}/${post.post_number}?from=hotdeal-best`}
                    className="block px-3 py-2.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors overflow-hidden"
                  >
                    {/* 제목 */}
                    <div className="text-xs text-gray-900 dark:text-[#F0F0F0] truncate mb-1">
                      {post.title}
                    </div>

                    {/* 쇼핑몰 + 가격 + 할인율 */}
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-gray-500 dark:text-gray-400">
                        {post.deal_info.store}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {formatPrice(post.deal_info.price)}
                      </span>
                      {discountRate && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {discountRate}%↓
                        </span>
                      )}
                      <span className="ml-auto">
                        {renderStats(post)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp } from 'lucide-react';
import { AuthorLink } from '@/domains/user/components';
import { extractFirstImageUrl } from './postlist/utils';
import { getProxiedImageUrl } from '@/shared/utils/imageProxy';
import { renderContentTypeIcons } from './postlist/components/shared/PostRenderers';
import { formatPrice, getDiscountRate } from '../../utils/hotdeal';
import type { DealInfo } from '../../types/hotdeal';
import { Container } from '@/shared/components/ui';
import { siteConfig } from '@/shared/config';
import AdSense from '@/shared/components/AdSense';

interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string | null;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  author_exp?: number;
  comment_count: number;
  content?: string;
  team_logo?: string | null;
  league_logo?: string | null;
  deal_info?: DealInfo | null;
}

interface PopularPostListProps {
  posts: Post[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function PopularPostList({
  posts,
  loading = false,
  emptyMessage = '게시글이 없습니다.'
}: PopularPostListProps) {
  if (loading) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D] p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">로딩 중...</div>
      </Container>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D] p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      </Container>
    );
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      {posts.map((post, index) => {
        const originalUrl = extractFirstImageUrl(post.content);
        const thumbnailUrl = getProxiedImageUrl(originalUrl); // 프록시 URL로 변환
        const postUrl = `/boards/${post.board_slug}/${post.post_number}`;
        const isLast = index === posts.length - 1;

        // 핫딜 정보 계산
        const dealInfo = post.deal_info;
        const discountRate = dealInfo ? getDiscountRate(dealInfo.price, dealInfo.original_price) : null;

        return (
          <React.Fragment key={post.id}>
          {index === 2 && (
            <div className="border-b border-black/5 dark:border-white/10">
              <AdSense
                adSlot="1026610665"
                adFormat="fluid"
                adLayoutKey="-h5-e+21-4q+5o"
                style={{ display: 'block' }}
              />
            </div>
          )}
          <div
            className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 bg-white dark:bg-[#1D1D1D] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors overflow-hidden ${
              !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
            }`}
          >
            {/* 추천 수 - 데스크톱에서만 표시 */}
            <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                {post.likes}
              </span>
              <ThumbsUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>

            {/* 썸네일 이미지 - 반응형 크기 */}
            <Link href={postUrl} className="flex-shrink-0">
              <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#262626]">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={siteConfig.logo}
                    alt="사이트 로고"
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-contain p-2 dark:invert"
                  />
                )}
              </div>
            </Link>

            {/* 게시글 정보 */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* 제목 + 아이콘 + 댓글 수 */}
              <Link href={postUrl} className="block overflow-hidden">
                <div className="flex items-center gap-1 mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                    {post.title}
                  </h3>
                  {renderContentTypeIcons(post)}
                  {post.comment_count > 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 flex-shrink-0 whitespace-nowrap">
                      [{post.comment_count}]
                    </span>
                  )}
                </div>
              </Link>

              {/* 핫딜 가격 정보 */}
              {dealInfo && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatPrice(dealInfo.price)}
                  </span>
                  {discountRate && (
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded">
                      {discountRate}%
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {dealInfo.shipping}
                  </span>
                </div>
              )}

              {/* 메타 정보 - 모바일 3줄, 데스크톱 1줄 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
                {/* 줄 2 (모바일) / 그룹 1 (데스크톱): 카테고리 + 작성자 */}
                <div className="flex items-center gap-2">
                  <Link href={`/boards/${post.board_slug}`} className="hover:underline text-gray-700 dark:text-gray-300">
                    {post.board_name}
                  </Link>

                  <AuthorLink
                    nickname={post.author_nickname}
                    publicId={post.author_public_id}
                    oddsUserId={post.author_id}
                    iconUrl={post.author_icon_url}
                    level={post.author_level || 1}
                    exp={post.author_exp}
                    iconSize={16}
                    hideIconOnMobile
                  />
                </div>

                {/* 데스크톱 구분선 */}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>

                {/* 줄 3 (모바일) / 그룹 2 (데스크톱): 추천 + 조회 + 시간 */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 sm:hidden" />
                    <span className="sm:hidden">추천</span>
                    {post.likes}
                  </span>

                  <span className="text-gray-300 dark:text-gray-600">|</span>

                  <span>조회 {post.views}</span>

                  <span className="text-gray-300 dark:text-gray-600">|</span>

                  <span>{post.formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
          </React.Fragment>
        );
      })}
    </Container>
  );
}

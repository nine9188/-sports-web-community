/**
 * 모바일 개별 게시글 아이템
 * PopularPostList 스타일 그대로 채택
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp } from 'lucide-react';
import { PostItemProps } from '../../types';
import { extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderContentTypeIcons } from '../shared/PostRenderers';
import { getProxiedImageUrl } from '@/shared/utils/imageProxy';
import { AuthorLink } from '@/domains/user/components';
import { formatPrice, getDiscountRate } from '@/domains/boards/utils/hotdeal';
import { siteConfig } from '@/shared/config';

export const MobilePostItem = React.memo(function MobilePostItem({
  post,
  isLast = false,
  currentPostId,
  currentBoardId,
  variant = 'text',
}: PostItemProps) {
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;

  const formattedDate = useMemo(() => {
    return post.formattedDate || '-';
  }, [post.formattedDate]);

  const thumbnailUrl = useMemo(() => {
    if (variant !== 'image-table') return null;
    const originalUrl = extractFirstImageUrl(post.content);
    return getProxiedImageUrl(originalUrl);
  }, [variant, post.content]);

  // 핫딜 정보 계산
  const dealInfo = post.deal_info;
  const isEnded = Boolean(dealInfo?.is_ended);
  const discountRate = dealInfo ? getDiscountRate(dealInfo.price, dealInfo.original_price) : null;

  // 제목 텍스트 및 스타일 계산
  const baseTitleText = getPostTitleText(post);
  const titleText = isEnded ? `[종료] ${baseTitleText}` : baseTitleText;
  const baseTitleClassName = getPostTitleClassName(post, isCurrentPost);
  const titleClassName = isEnded
    ? `${baseTitleClassName} line-through text-gray-400 dark:text-gray-500`
    : baseTitleClassName;

  // image-table variant: PopularPostList 스타일
  if (variant === 'image-table') {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-2 overflow-hidden ${
          !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
        } ${isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${
          isEnded ? 'opacity-60' : ''
        }`}
      >
        {/* 썸네일 이미지 */}
        <Link href={href} prefetch={false} className="flex-shrink-0">
          <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#262626]">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={titleText}
                fill
                sizes="80px"
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <Image
                src={siteConfig.logo}
                alt="사이트 로고"
                fill
                sizes="80px"
                className="object-contain p-2 dark:invert"
              />
            )}
          </div>
        </Link>

        {/* 게시글 정보 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* 제목 + 아이콘 + 댓글 수 */}
          <Link href={href} prefetch={false} className="block overflow-hidden">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className={`${titleClassName} truncate`}>
                {titleText}
              </h3>
              {!post.is_deleted && !post.is_hidden && (
                <>
                  {renderContentTypeIcons(post)}
                  {post.comment_count > 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 flex-shrink-0 whitespace-nowrap">
                      [{post.comment_count}]
                    </span>
                  )}
                </>
              )}
            </div>
          </Link>

          {/* 핫딜 정보 */}
          {dealInfo && (
            <div className="flex items-center gap-1.5 mb-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span>{dealInfo.store}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-red-600 dark:text-red-400 font-bold">{formatPrice(dealInfo.price)}</span>
              {discountRate && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">{discountRate}%↓</span>
                </>
              )}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{dealInfo.shipping}</span>
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
            {/* 게시판 + 작성자 */}
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
                iconSize={16}
              />
            </div>
            {/* 추천 + 조회 + 시간 */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {post.likes || 0}
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>조회 {post.views || 0}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // text variant: 기존 스타일
  return (
    <div
      className={`px-3 py-2 w-full overflow-hidden ${
        !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
      } ${isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${
        isEnded ? 'opacity-60' : ''
      }`}
    >
      <Link href={href} prefetch={false} className="block w-full overflow-hidden">
        <div className="flex items-center gap-1 mb-1.5">
          <span className={`${titleClassName} truncate`}>
            {titleText}
          </span>
          {!post.is_deleted && !post.is_hidden && (
            <>
              {renderContentTypeIcons(post)}
              {post.comment_count > 0 && (
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0 whitespace-nowrap">
                  [{post.comment_count}]
                </span>
              )}
            </>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <AuthorLink
          nickname={post.author_nickname}
          publicId={post.author_public_id}
          oddsUserId={post.author_id}
          iconUrl={post.author_icon_url}
          level={post.author_level || 1}
          iconSize={16}
        />
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
});

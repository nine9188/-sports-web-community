/**
 * 모바일 개별 게시글 아이템
 * PopularPostList 스타일 그대로 채택
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PostItemProps } from '../../types';
import { buildPostDetailHref, extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderContentTypeIcons } from '../shared/PostRenderers';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl } from '@/shared/images/urls';
import { AuthorLink } from '@/domains/user/components';
import { formatPrice, getDiscountRate } from '@/domains/boards/utils/hotdeal';
import PostTitleWithCommentCount from '@/domains/boards/components/post/PostTitleWithCommentCount';
import { PostLabelBadge } from '../shared/PostLabelBadge';

const FALLBACK_LIGHT = '/logo/4590_logo_02-01.jpg';
const FALLBACK_DARK = '/logo/4590_logo_02-02.jpg';

export const MobilePostItem = React.memo(function MobilePostItem({
  post,
  isLast = false,
  currentPostId,
  currentBoardId,
  currentPage,
  variant = 'text',
}: PostItemProps) {
  const isCurrentPost = post.id === currentPostId;
  // SEO: 쿼리 파라미터 제거 - Google 중복 색인 방지
  const href = buildPostDetailHref(post.board_slug, post.post_number, currentBoardId, currentPage);

  // from 정보를 sessionStorage에 저장 (클릭 시)
  const handleClick = useCallback(() => {
    if (currentBoardId && typeof window !== 'undefined') {
      sessionStorage.setItem('postListSource', currentBoardId);
    }
  }, [currentBoardId]);

  const formattedDate = useMemo(() => {
    return post.formattedDate || '-';
  }, [post.formattedDate]);

  const thumbnailUrl = useMemo(() => {
    if (variant !== 'image-table') return null;
    const originalUrl = post.thumbnail_url ?? extractFirstImageUrl(post.content);
    return originalUrl?.trim()
      ? normalizeDisplayImageUrl(originalUrl, { proxyExternal: true })
      : null;
  }, [variant, post.thumbnail_url, post.content]);

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
        <Link href={href} prefetch={false} className="flex-shrink-0" onClick={handleClick}>
          <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#262626]">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={titleText}
                fill
                sizes="80px"
                className="object-cover"
                loading="lazy"
                unoptimized={shouldUnoptimizeImageUrl(thumbnailUrl)}
              />
            ) : (
              <>
                <Image
                  src={FALLBACK_LIGHT}
                  alt="4590 Football"
                  fill
                  sizes="80px"
                  className="object-cover dark:hidden"
                />
                <Image
                  src={FALLBACK_DARK}
                  alt="4590 Football"
                  fill
                  sizes="80px"
                  className="object-cover hidden dark:block"
                />
              </>
            )}
          </div>
        </Link>

        {/* 게시글 정보 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* 제목 + 아이콘 + 댓글 수 */}
          <Link href={href} prefetch={false} className="block overflow-hidden" onClick={handleClick}>
            <div className="flex items-center gap-1 mb-0.5">
              <PostLabelBadge post={post} size="sm" />
              <PostTitleWithCommentCount
                title={titleText}
                commentCount={!post.is_deleted && !post.is_hidden ? post.comment_count : 0}
                titleClassName={titleClassName}
                childrenBeforeComment={!post.is_deleted && !post.is_hidden ? renderContentTypeIcons(post) : null}
                inlineComment={!post.is_deleted && !post.is_hidden}
                clampClassName="truncate"
              />
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
          <div className="flex text-[11px] text-gray-500 dark:text-gray-400">
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center overflow-hidden whitespace-nowrap">
                <Link href={`/boards/${post.board_slug}`} prefetch={false} className="hover:underline text-gray-700 dark:text-gray-300 truncate" style={{maxWidth: '80px'}}>
                  {post.board_name}
                </Link>
                <span className="mx-1 flex-shrink-0">|</span>
                <AuthorLink
                  nickname={post.author_nickname}
                  publicId={post.author_public_id}
                  oddsUserId={post.author_id}
                  iconUrl={post.author_icon_url}
                  level={post.author_level || 1}
                  exp={post.author_exp}
                  iconSize={20}
                  showIcon={false}
                />
                <span className="mx-1 flex-shrink-0">|</span>
                <span className="flex-shrink-0">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                <span>조회 {post.views || 0}</span>
                <span>추천 {post.likes || 0}</span>
              </div>
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
      <Link href={href} prefetch={false} className="block w-full overflow-hidden" onClick={handleClick}>
        <div className="flex items-center gap-1 mb-1.5">
          <PostLabelBadge post={post} size="sm" />
              <PostTitleWithCommentCount
                title={titleText}
                commentCount={!post.is_deleted && !post.is_hidden ? post.comment_count : 0}
                titleClassName={titleClassName}
                clampClassName="line-clamp-2"
                inlineComment
              />
              {!post.is_deleted && !post.is_hidden && (
                <>
                  {renderContentTypeIcons(post)}
                </>
              )}
        </div>
      </Link>

      <div className="flex text-[11px] text-gray-500 dark:text-gray-400">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center overflow-hidden whitespace-nowrap">
            <Link href={`/boards/${post.board_slug}`} prefetch={false} className="hover:underline text-gray-700 dark:text-gray-300 truncate" style={{maxWidth: '80px'}}>
              {post.board_name}
            </Link>
            <span className="mx-1 flex-shrink-0">|</span>
            <AuthorLink
              nickname={post.author_nickname}
              publicId={post.author_public_id}
              oddsUserId={post.author_id}
              iconUrl={post.author_icon_url}
              level={post.author_level || 1}
              exp={post.author_exp}
              iconSize={20}
              showIcon={false}
            />
            <span className="mx-1 flex-shrink-0">|</span>
            <span className="flex-shrink-0">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            <span>조회 {post.views || 0}</span>
            <span>추천 {post.likes || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * 데스크톱 개별 게시글 아이템
 *
 * - text variant: 테이블 row (<tr>)
 * - image-table variant: 카드형 (<div>)
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp } from 'lucide-react';
import { PostItemProps } from '../../types';
import { buildPostDetailHref, extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderContentTypeIcons, renderAuthor, renderBoardLogo } from '../shared/PostRenderers';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl, SITE_ICON_URL } from '@/shared/images/urls';
import { AuthorLink } from '@/domains/user/components';
import { formatPrice, getDiscountRate } from '@/domains/boards/utils/hotdeal';
import PostTitleWithCommentCount from '@/domains/boards/components/post/PostTitleWithCommentCount';
import { hasPostLabel, PostLabelBadge } from '../shared/PostLabelBadge';

/**
 * 데스크톱 게시글 아이템 (비가상화)
 */
export const DesktopPostItem = React.memo(function DesktopPostItem({
  post,
  isLast = false,
  currentPostId,
  currentBoardId,
  currentPage,
  showBoard = true,
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

  // 안전한 날짜 포맷팅
  const formattedDate = useMemo(() => {
    return post.formattedDate || '-';
  }, [post.formattedDate]);

  // 썸네일 URL 추출 (image-table variant일 때만)
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

  // image-table variant: 카드형 레이아웃 (PopularPostList 스타일)
  if (variant === 'image-table') {
    return (
      <div
        className={`flex items-center gap-4 px-4 py-2 ${
          !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
        } ${isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} ${
          isEnded ? 'opacity-60' : ''
        } hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors overflow-hidden`}
      >
        {/* 추천 수 */}
        <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
          <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
            {post.likes || 0}
          </span>
          <ThumbsUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>

        {/* 썸네일 이미지 */}
        <Link href={href} prefetch={false} className="flex-shrink-0" onClick={handleClick}>
          <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#262626]">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={titleText}
                fill
                sizes="96px"
                className="object-cover"
                loading="lazy"
                unoptimized={shouldUnoptimizeImageUrl(thumbnailUrl)}
              />
            ) : (
              <Image
                src={SITE_ICON_URL}
                alt="사이트 로고"
                fill
                sizes="96px"
                className="object-contain p-2 dark:invert"
              />
            )}
          </div>
        </Link>

        {/* 게시글 정보 */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* 제목 + 아이콘 + 댓글 수 */}
          <Link href={href} prefetch={false} className="block overflow-hidden" onClick={handleClick}>
            <div className="flex items-center gap-1 mb-1">
              <PostLabelBadge post={post} />
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
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500 dark:text-gray-400">
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
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {hasPostLabel(post) ? (
              <Link href={post.is_notice ? '/boards/notice' : `/boards/${post.board_slug}`} prefetch={false} className="inline-flex items-center">
                <PostLabelBadge post={post} size="sm" />
              </Link>
            ) : (
              <Link href={`/boards/${post.board_slug}`} prefetch={false} className="hover:underline text-gray-700 dark:text-gray-300">
                {post.board_name}
              </Link>
            )}

            <AuthorLink
              nickname={post.author_nickname}
              publicId={post.author_public_id}
              authorId={post.author_id}
              iconUrl={post.author_icon_url}
              level={post.author_level || 1}
              exp={post.author_exp}
              iconSize={20}
            />

            <span className="text-gray-300 dark:text-gray-600">|</span>

            <span>추천 {post.likes || 0}</span>

            <span className="text-gray-300 dark:text-gray-600">|</span>

            <span>조회 {post.views || 0}</span>

            <span className="text-gray-300 dark:text-gray-600">|</span>

            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    );
  }

  // text variant: 테이블 row
  return (
    <tr
      className={`${
        !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
      } hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
        isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
      } ${isEnded ? 'opacity-60' : ''}`}
    >
      {/* 게시판 컬럼 */}
      {showBoard && (
        <td className="py-2 px-1 align-middle">
          {hasPostLabel(post) ? (
            <div className="flex justify-center items-center w-full">
              <Link href={post.is_notice ? '/boards/notice' : `/boards/${post.board_slug}`} prefetch={false} className="inline-flex items-center">
                <PostLabelBadge post={post} />
              </Link>
            </div>
          ) : (
            <div className="flex justify-start items-center w-full min-w-0">
              {renderBoardLogo(post)}
            </div>
          )}
        </td>
      )}

      {/* 제목 컬럼 */}
      <td className="py-2 px-1 align-middle">
        <Link href={href} prefetch={false} onClick={handleClick}>
          <div className="flex items-center gap-1 min-w-0">
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
      </td>

      {/* 글쓴이 컬럼 */}
      <td className="py-2 px-1 text-left text-xs text-gray-500 dark:text-gray-400 align-middle">
        {renderAuthor(post, 20, 'justify-start')}
      </td>

      {/* 날짜 컬럼 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {formattedDate}
      </td>

      {/* 조회 컬럼 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {post.views || 0}
      </td>

      {/* 추천 컬럼 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {post.likes || 0}
      </td>
    </tr>
  );
});

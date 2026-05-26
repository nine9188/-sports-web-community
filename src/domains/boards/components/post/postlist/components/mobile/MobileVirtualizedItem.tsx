/**
 * 모바일 가상화 아이템
 * PopularPostList 스타일 그대로 채택
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post, PostVariant } from '../../types';
import { buildPostDetailHref, extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderAuthor, renderContentTypeIcons } from '../shared/PostRenderers';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl } from '@/shared/images/urls';
import PostTitleWithCommentCount from '@/domains/boards/components/post/PostTitleWithCommentCount';

interface VirtualizedItemData {
  posts: Post[];
  currentPostId?: string;
  currentBoardId: string;
  currentPage?: number;
  variant: PostVariant;
}

interface VirtualizedItemProps {
  index: number;
  style: React.CSSProperties;
  data: VirtualizedItemData;
}

export const MobileVirtualizedItem = React.memo(function MobileVirtualizedItem({
  index,
  style,
  data,
}: VirtualizedItemProps) {
  const { posts, currentPostId, currentBoardId, currentPage, variant } = data;
  const post = posts[index];

  // from 정보를 sessionStorage에 저장 (클릭 시)
  const handleClick = useCallback(() => {
    if (currentBoardId && typeof window !== 'undefined') {
      sessionStorage.setItem('postListSource', currentBoardId);
    }
  }, [currentBoardId]);

  const formattedDate = useMemo(() => {
    return post?.formattedDate || '-';
  }, [post?.formattedDate]);

  const thumbnailUrl = useMemo(() => {
    if (!post || variant !== 'image-table') return null;
    const originalUrl = post.thumbnail_url ?? extractFirstImageUrl(post.content);
    return originalUrl?.trim()
      ? normalizeDisplayImageUrl(originalUrl, { proxyExternal: true })
      : null;
  }, [variant, post]);

  if (!post) return null;

  const isCurrentPost = post.id === currentPostId;
  const href = buildPostDetailHref(post.board_slug, post.post_number, currentBoardId, currentPage);
  const titleText = getPostTitleText(post);
  const titleClassName = getPostTitleClassName(post, isCurrentPost);

  return (
    <div
      style={style}
      className={`px-3 py-2 w-full overflow-hidden border-b border-black/5 dark:border-white/10 ${
        isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
      }`}
    >
      <Link href={href} prefetch={false} className="block w-full overflow-hidden" onClick={handleClick}>
        <div className="flex items-center gap-1 mb-1.5">
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

      <div className="flex text-[11px] text-gray-500 dark:text-gray-400">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center overflow-hidden whitespace-nowrap">
            <span className="text-gray-700 dark:text-gray-300 truncate" style={{maxWidth: '80px'}}>
              {post.board_name || '-'}
            </span>
            <span className="mx-1 flex-shrink-0">|</span>
            {renderAuthor(post, 16, 'justify-start')}
            <span className="mx-1 flex-shrink-0">|</span>
            <span className="flex-shrink-0">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            <span>조회 {post.views || 0}</span>
            <span>추천 {post.likes || 0}</span>
          </div>
        </div>
      </div>

      {thumbnailUrl && (
        <div className="mt-2">
          <div className="relative w-28 h-16 rounded overflow-hidden border border-black/5 dark:border-white/10">
            <Image
              src={thumbnailUrl}
              alt="썸네일"
              fill
              sizes="112px"
              className="object-cover"
              loading="lazy"
              unoptimized={shouldUnoptimizeImageUrl(thumbnailUrl)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

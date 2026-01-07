/**
 * 모바일 개별 게시글 아이템
 * PopularPostList 스타일 그대로 채택
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar as CalendarIcon } from 'lucide-react';
import { PostItemProps } from '../../types';
import { extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderAuthor, renderContentTypeIcons } from '../shared/PostRenderers';
import { getProxiedImageUrl } from '@/shared/utils/imageProxy';

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

  const titleText = getPostTitleText(post);
  const titleClassName = getPostTitleClassName(post, isCurrentPost);

  return (
    <div
      className={`px-3 py-2 w-full overflow-hidden ${
        !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
      } ${isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
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
        {renderAuthor(post, 16, 'justify-start')}
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="flex items-center">
          <CalendarIcon className="w-3 h-3 mr-0.5" />
          {formattedDate}
        </span>
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
            />
          </div>
        </div>
      )}
    </div>
  );
});

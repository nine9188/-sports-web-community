/**
 * 모바일 가상화 아이템
 * PopularPostList 스타일 그대로 채택
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Post, PostVariant } from '../../types';
import { extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderAuthor, renderContentTypeIcons } from '../shared/PostRenderers';
import { getProxiedImageUrl } from '@/shared/utils/imageProxy';

interface VirtualizedItemData {
  posts: Post[];
  currentPostId?: string;
  currentBoardId: string;
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
  const { posts, currentPostId, currentBoardId, variant } = data;
  const post = posts[index];

  // from 정보를 sessionStorage에 저장 (클릭 시)
  const handleClick = useCallback(() => {
    if (currentBoardId && typeof window !== 'undefined') {
      sessionStorage.setItem('postListSource', currentBoardId);
    }
  }, [currentBoardId]);

  if (!post) return null;

  const isCurrentPost = post.id === currentPostId;
  // SEO: 쿼리 파라미터 제거 - Google 중복 색인 방지
  const href = `/boards/${post.board_slug}/${post.post_number}`;

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
      style={style}
      className={`px-3 py-2 w-full overflow-hidden border-b border-black/5 dark:border-white/10 ${
        isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
      }`}
    >
      <Link href={href} prefetch={false} className="block w-full overflow-hidden" onClick={handleClick}>
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

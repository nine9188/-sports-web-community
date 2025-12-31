/**
 * 데스크톱 가상화 아이템 (react-window wrapper)
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar as CalendarIcon, Eye as EyeIcon } from 'lucide-react';
import { Post, PostVariant } from '../../types';
import { extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderContentTypeIcons, renderAuthor, renderBoardLogo } from '../shared/PostRenderers';

interface VirtualizedItemData {
  posts: Post[];
  currentPostId?: string;
  currentBoardId: string;
  showBoard: boolean;
  variant: PostVariant;
}

interface VirtualizedItemProps {
  index: number;
  style: React.CSSProperties;
  data: VirtualizedItemData;
}

/**
 * react-window용 가상화 데스크톱 아이템
 */
export const DesktopVirtualizedItem = React.memo(function DesktopVirtualizedItem({
  index,
  style,
  data,
}: VirtualizedItemProps) {
  const { posts, currentPostId, currentBoardId, showBoard, variant } = data;
  const post = posts[index];

  // 안전한 날짜 포맷팅 (Hook은 early return 전에 호출)
  const formattedDate = useMemo(() => {
    return post?.formattedDate || '-';
  }, [post?.formattedDate]);

  // 썸네일 URL 추출 (Hook은 early return 전에 호출)
  const thumbnailUrl = useMemo(() => {
    return variant === 'image-table' && post ? extractFirstImageUrl(post.content) : null;
  }, [variant, post]);

  if (!post) return null;

  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;

  // 제목 텍스트 및 스타일 계산
  const titleText = getPostTitleText(post);
  const titleClassName = getPostTitleClassName(post, isCurrentPost);

  // image-table variant는 가상화에서 지원하지 않음 (복잡도 감소)
  // text variant만 가상화 렌더링
  return (
    <div
      style={style}
      className={`flex border-b border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
        isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
      }`}
    >
      {/* 게시판 컬럼 */}
      {showBoard && (
        <div className="py-2 px-3 flex items-center" style={{ width: '120px' }}>
          {renderBoardLogo(post)}
        </div>
      )}

      {/* 제목 컬럼 */}
      <div className="py-2 px-4 flex-1 min-w-0">
        <Link href={href} prefetch={false}>
          <div className="flex items-center gap-1 min-w-0">
            <span className={`${titleClassName} truncate`}>
              {titleText}
            </span>
            {!post.is_deleted && !post.is_hidden && (
              <>
                {renderContentTypeIcons(post)}
                {post.comment_count > 0 && (
                  <span
                    className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0 whitespace-nowrap"
                    title={`댓글 ${post.comment_count}개`}
                  >
                    [{post.comment_count}]
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center overflow-hidden whitespace-nowrap">
            {renderAuthor(post, 20, 'justify-start')}
            <span className="mx-1 flex-shrink-0">|</span>
            <span className="flex-shrink-0 flex items-center">
              <CalendarIcon className="w-3 h-3 mr-0.5" />
              {formattedDate}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="flex items-center">
              <EyeIcon className="w-3 h-3 mr-0.5" />
              {post.views || 0}
            </span>
            <span>추천 {post.likes || 0}</span>
          </div>
        </div>
      </div>

      {/* 글쓴이 컬럼 */}
      <div className="py-2 px-3 flex items-center justify-start" style={{ width: '120px' }}>
        {renderAuthor(post, 20, 'justify-start')}
      </div>

      {/* 날짜 컬럼 */}
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '80px' }}>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
      </div>

      {/* 조회 컬럼 */}
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '60px' }}>
        <span className="text-xs text-gray-500 dark:text-gray-400">{post.views || 0}</span>
      </div>

      {/* 추천 컬럼 */}
      <div className="py-2 px-1 flex items-center justify-center" style={{ width: '60px' }}>
        <span className="text-xs text-gray-500 dark:text-gray-400">{post.likes || 0}</span>
      </div>

      {/* 썸네일 컬럼 (image-table variant) */}
      {variant === 'image-table' && thumbnailUrl && (
        <div className="py-2 px-2 flex items-center justify-center" style={{ width: '96px' }}>
          <div className="relative w-16 h-16 rounded overflow-hidden border border-black/5 dark:border-white/10">
            <Image
              src={thumbnailUrl}
              alt="썸네일"
              fill
              sizes="64px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
});

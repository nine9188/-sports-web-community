/**
 * 데스크톱 개별 게시글 아이템
 *
 * - text variant: 테이블 row (<tr>)
 * - image-table variant: 카드형 (<div>)
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar as CalendarIcon, Eye as EyeIcon } from 'lucide-react';
import { PostItemProps } from '../../types';
import { extractFirstImageUrl, getPostTitleText, getPostTitleClassName } from '../../utils';
import { renderContentTypeIcons, renderAuthor, renderBoardLogo } from '../shared/PostRenderers';

/**
 * 데스크톱 게시글 아이템 (비가상화)
 */
export const DesktopPostItem = React.memo(function DesktopPostItem({
  post,
  isLast = false,
  currentPostId,
  currentBoardId,
  showBoard = true,
  variant = 'text',
}: PostItemProps) {
  const isCurrentPost = post.id === currentPostId;
  const href = `/boards/${post.board_slug}/${post.post_number}?from=${currentBoardId}`;

  // 안전한 날짜 포맷팅
  const formattedDate = useMemo(() => {
    return post.formattedDate || '-';
  }, [post.formattedDate]);

  // 썸네일 URL 추출 (image-table variant일 때만)
  const thumbnailUrl = useMemo(() => {
    return variant === 'image-table' ? extractFirstImageUrl(post.content) : null;
  }, [variant, post.content]);

  // 제목 텍스트 및 스타일 계산
  const titleText = getPostTitleText(post);
  const titleClassName = getPostTitleClassName(post, isCurrentPost);

  // image-table variant: 카드형 레이아웃
  if (variant === 'image-table') {
    return (
      <div
        className={`py-2 px-3 ${
          !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
        } ${isCurrentPost ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors`}
      >
        <Link href={href} prefetch={false}>
          <div className="flex items-center justify-between gap-1">
            {/* 좌측 영역: 세로 정렬 (아이콘 / 숫자 / 추천) */}
            <div className="py-1 px-0.5 hidden sm:flex justify-center text-gray-600 dark:text-gray-400" style={{ width: '60px' }}>
              <div className="flex flex-col items-center text-xs leading-none space-y-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path fill="currentColor" d="M12 4 L20 12 H4 Z" />
                  <rect x="10" y="12" width="4" height="6" rx="1" fill="currentColor" />
                </svg>
                <span>{post.likes || 0}</span>
                <span>추천</span>
              </div>
            </div>

            {/* 중앙 영역: 제목 + 메타정보 */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
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

              {/* 제목 아래: 게시판 이름 + 메타정보 */}
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center max-w-[140px] truncate rounded bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-0.5 text-gray-700 dark:text-gray-300">
                  {post.board_name}
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                {renderAuthor(post, 20, 'justify-start')}
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="flex items-center">
                  <CalendarIcon className="w-3 h-3 mr-0.5" />
                  {formattedDate}
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="flex items-center">
                  <EyeIcon className="w-3 h-3 mr-0.5" />
                  {post.views || 0}
                </span>
              </div>
            </div>

            {/* 우측 영역: 썸네일 */}
            <div className="flex-shrink-0">
              {thumbnailUrl && (
                <div className="relative w-36 h-20 rounded overflow-hidden border border-black/5 dark:border-white/10">
                  <Image
                    src={thumbnailUrl}
                    alt="썸네일"
                    fill
                    sizes="240px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </Link>
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
      }`}
    >
      {/* 게시판 컬럼 */}
      {showBoard && (
        <td className="py-2 px-3 align-middle">
          {renderBoardLogo(post)}
        </td>
      )}

      {/* 제목 컬럼 */}
      <td className="py-2 px-4 align-middle">
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
      </td>

      {/* 글쓴이 컬럼 */}
      <td className="py-2 px-3 text-left text-xs text-gray-500 dark:text-gray-400 align-middle">
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

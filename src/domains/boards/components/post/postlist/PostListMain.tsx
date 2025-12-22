/**
 * PostList 메인 컴포넌트
 *
 * - 모바일/데스크톱 감지 후 적절한 컴포넌트 렌더링
 * - 공통 wrapper (header, footer, ScrollArea) 관리
 *
 * 이 파일은 100줄 이하로 유지하여 가독성 확보
 */

'use client';

import React, { useDeferredValue } from 'react';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { PostListProps } from './types';
import { useIsMobile } from './hooks';
import { PostListSkeleton } from './components/shared/PostListSkeleton';
import { PostListEmpty } from './components/shared/PostListEmpty';
import { MobilePostList } from './components/mobile/MobilePostList';
import { DesktopPostList } from './components/desktop/DesktopPostList';

/**
 * PostList 메인 진입점
 *
 * @example
 * ```tsx
 * <PostList
 *   posts={posts}
 *   currentBoardId="board-1"
 *   variant="text"
 *   showBoard={true}
 * />
 * ```
 */
export default function PostList({
  posts,
  loading = false,
  showBoard = true,
  currentPostId,
  emptyMessage = '게시글이 없습니다.',
  headerContent,
  footerContent,
  className = '',
  maxHeight,
  currentBoardId,
  variant = 'text',
}: PostListProps) {
  // 모바일/데스크톱 감지
  const isMobile = useIsMobile();

  // React 18 동시성 기능: loading 상태를 지연시켜 깜빡임 방지
  const deferredLoading = useDeferredValue(loading);

  return (
    <div
      className={`bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-0 m-0 ${className}`}
    >
      {/* Header */}
      {headerContent && (
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10 rounded-t-lg">
          {headerContent}
        </div>
      )}

      {/* Main Content */}
      <ScrollArea
        className={`h-full w-full overflow-x-hidden ${isMobile && maxHeight?.startsWith('sm:') ? '' : ''}`}
        style={{
          maxHeight: (() => {
            if (!maxHeight) return 'none';

            // 모바일에서 sm: prefix 처리
            if (isMobile && maxHeight.startsWith('sm:')) {
              return 'none'; // 모바일에서는 높이 제한 없음
            }

            // 데스크톱에서 sm: prefix 제거
            if (maxHeight.startsWith('sm:')) {
              return maxHeight.replace('sm:', '');
            }

            return maxHeight;
          })(),
        }}
      >
        {deferredLoading ? (
          <PostListSkeleton />
        ) : posts.length === 0 ? (
          <PostListEmpty message={emptyMessage} />
        ) : isMobile ? (
          <MobilePostList
            posts={posts}
            currentPostId={currentPostId}
            currentBoardId={currentBoardId}
            variant={variant}
            maxHeight={maxHeight}
          />
        ) : (
          <DesktopPostList
            posts={posts}
            currentPostId={currentPostId}
            currentBoardId={currentBoardId}
            showBoard={showBoard}
            variant={variant}
            maxHeight={maxHeight}
          />
        )}
      </ScrollArea>

      {/* Footer */}
      {footerContent && <div>{footerContent}</div>}
    </div>
  );
}

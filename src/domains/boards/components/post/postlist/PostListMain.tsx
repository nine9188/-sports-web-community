/**
 * PostList 메인 컴포넌트
 *
 * - CSS 미디어 쿼리로 모바일/데스크톱 분기 (하이드레이션 불일치 방지)
 * - 공통 wrapper (header, footer) 관리
 * - 서버 컴포넌트로 LCP 최적화 (초기 HTML에 콘텐츠 포함)
 *
 * 렌더링 전략:
 * - 30개 미만: 서버 컴포넌트 사용 (MobilePostListServer, DesktopPostListServer)
 * - 30개 이상: 클라이언트 가상화 사용 (MobilePostList, DesktopPostList)
 */

import React from 'react';
import { PostListProps } from './types';
import { PostListSkeleton } from './components/shared/PostListSkeleton';
import { PostListEmpty } from './components/shared/PostListEmpty';
import { MobilePostListServer } from './components/mobile/MobilePostListServer';
import { DesktopPostListServer } from './components/desktop/DesktopPostListServer';
import { VirtualizedPostList } from './VirtualizedPostList';
import { VIRTUALIZATION_THRESHOLD } from './constants';

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

  // maxHeight 처리: sm: prefix가 있으면 데스크톱에서만 적용
  const getMaxHeightStyle = () => {
    if (!maxHeight) return {};

    // sm: prefix가 있으면 CSS로 처리 (모바일: none, 데스크톱: 값)
    if (maxHeight.startsWith('sm:')) {
      return {}; // CSS 클래스로 처리
    }

    return { maxHeight };
  };

  // sm: prefix maxHeight를 위한 CSS 클래스
  const maxHeightClass = maxHeight?.startsWith('sm:')
    ? `max-h-none sm:max-h-[${maxHeight.replace('sm:', '')}]`
    : '';

  // 가상화 사용 여부 결정 (30개 이상일 때만)
  const useVirtualization = posts.length > VIRTUALIZATION_THRESHOLD;

  return (
    <div
      className={`bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden p-0 m-0 ${className}`}
    >
      {/* Header */}
      {headerContent && (
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 md:rounded-t-lg">
          {headerContent}
        </div>
      )}

      {/* Main Content */}
      <div
        className={`h-full w-full overflow-y-auto overflow-x-hidden ${maxHeightClass}`}
        style={getMaxHeightStyle()}
      >
        {loading ? (
          <PostListSkeleton />
        ) : posts.length === 0 ? (
          <PostListEmpty message={emptyMessage} />
        ) : useVirtualization ? (
          // 30개 이상: 클라이언트 가상화 (react-window는 dynamic import로 지연 로드)
          <VirtualizedPostList
            posts={posts}
            currentPostId={currentPostId}
            currentBoardId={currentBoardId}
            showBoard={showBoard}
            variant={variant}
            maxHeight={maxHeight}
          />
        ) : (
          // 30개 미만: 서버 렌더링 (LCP 최적화)
          <>
            <MobilePostListServer
              posts={posts}
              currentPostId={currentPostId}
              currentBoardId={currentBoardId}
              variant={variant}
            />
            <DesktopPostListServer
              posts={posts}
              currentPostId={currentPostId}
              currentBoardId={currentBoardId}
              showBoard={showBoard}
              variant={variant}
            />
          </>
        )}
      </div>

      {/* Footer */}
      {footerContent && <div>{footerContent}</div>}
    </div>
  );
}

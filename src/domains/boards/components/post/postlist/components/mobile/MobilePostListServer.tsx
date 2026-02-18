/**
 * 모바일 게시글 리스트 (서버 컴포넌트)
 *
 * - 30개 미만일 때 사용
 * - useDeferredValue 없이 직접 렌더링
 * - LCP 최적화: 초기 HTML에 콘텐츠 포함
 */

import React from 'react';
import { PostListProps } from '../../types';
import { MobilePostItem } from './MobilePostItem';
import { PostListInFeedAd, POST_LIST_AD_INDEX } from '../shared/PostListInFeedAd';

type MobilePostListServerProps = Omit<
  PostListProps,
  'loading' | 'showBoard' | 'emptyMessage' | 'headerContent' | 'footerContent' | 'className'
>;

/**
 * 모바일 게시글 리스트 서버 컴포넌트
 */
export function MobilePostListServer({
  posts,
  currentPostId,
  currentBoardId,
  variant = 'text',
}: MobilePostListServerProps) {
  return (
    <div className="mobile-post-list block sm:hidden w-full max-w-full overflow-hidden">
      {posts.map((post, index) => (
        <React.Fragment key={post.id}>
          <MobilePostItem
            post={post}
            isLast={index === posts.length - 1}
            currentPostId={currentPostId}
            currentBoardId={currentBoardId}
            showBoard={false}
            variant={variant}
          />
          {index === POST_LIST_AD_INDEX - 1 && <PostListInFeedAd />}
        </React.Fragment>
      ))}
    </div>
  );
}

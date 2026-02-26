/**
 * 모바일 게시글 리스트
 *
 * - 30개 미만: 일반 렌더링
 * - 30개 이상: react-window 가상화
 */

'use client';

import React, { useDeferredValue, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PostListProps } from '../../types';
import { calculateHeight } from '../../utils';
import {
  VIRTUALIZATION_THRESHOLD,
  ITEM_HEIGHTS,
  VIRTUALIZATION_OVERSCAN_COUNT,
} from '../../constants';
import { MobilePostItem } from './MobilePostItem';
import { MobileVirtualizedItem } from './MobileVirtualizedItem';

/**
 * 모바일 게시글 리스트 컨테이너
 */
export function MobilePostList({
  posts,
  currentPostId,
  currentBoardId,
  variant = 'text',
  maxHeight,
}: Omit<PostListProps, 'loading' | 'showBoard' | 'emptyMessage' | 'headerContent' | 'footerContent' | 'className'>) {
  // React 18 동시성 기능: posts 데이터를 지연시켜 메인 스레드 블로킹 방지
  const deferredPosts = useDeferredValue(posts);

  // 가상화 사용 여부 결정
  const useVirtualization = deferredPosts.length > VIRTUALIZATION_THRESHOLD;

  // 가상화 리스트 높이 계산
  const listHeight = useMemo(() => {
    if (!maxHeight) {
      // maxHeight가 없으면 콘텐츠 높이에 맞춤 (최대 600px)
      const contentHeight =
        deferredPosts.length *
        (variant === 'image-table'
          ? ITEM_HEIGHTS.MOBILE_IMAGE_TABLE
          : ITEM_HEIGHTS.MOBILE_TEXT);
      return Math.min(contentHeight, 600);
    }

    // sm: prefix가 있으면 모바일에서는 높이 제한 없음
    if (maxHeight.startsWith('sm:')) {
      const contentHeight =
        deferredPosts.length *
        (variant === 'image-table'
          ? ITEM_HEIGHTS.MOBILE_IMAGE_TABLE
          : ITEM_HEIGHTS.MOBILE_TEXT);
      return Math.min(contentHeight + 100, 600);
    }

    return calculateHeight(maxHeight);
  }, [maxHeight, deferredPosts.length, variant]);

  // 가상화 데이터 메모이제이션
  const virtualizedData = useMemo(
    () => ({
      posts: deferredPosts,
      currentPostId,
      currentBoardId,
      variant,
    }),
    [deferredPosts, currentPostId, currentBoardId, variant]
  );

  // 아이템 높이 계산
  const itemSize =
    variant === 'image-table'
      ? ITEM_HEIGHTS.MOBILE_IMAGE_TABLE
      : ITEM_HEIGHTS.MOBILE_TEXT;

  // 가상화 렌더링
  if (useVirtualization) {
    return (
      <div className="mobile-post-list block sm:hidden w-full overflow-hidden" style={{ maxWidth: '100vw' }}>
        <List
          height={listHeight}
          itemCount={deferredPosts.length}
          itemSize={itemSize}
          itemData={virtualizedData}
          overscanCount={VIRTUALIZATION_OVERSCAN_COUNT}
          width="100%"
          style={{ overflow: 'hidden' }}
        >
          {MobileVirtualizedItem}
        </List>
      </div>
    );
  }

  // 일반 렌더링
  return (
    <div className="mobile-post-list block sm:hidden w-full max-w-full overflow-hidden">
      {deferredPosts.map((post, index) => (
        <React.Fragment key={post.id}>
          <MobilePostItem
            post={post}
            isLast={index === deferredPosts.length - 1}
            currentPostId={currentPostId}
            currentBoardId={currentBoardId}
            showBoard={false}
            variant={variant}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

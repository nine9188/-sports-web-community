/**
 * 데스크톱 게시글 리스트
 *
 * - text variant: 테이블 형식 (헤더 + tbody)
 * - image-table variant: 카드 리스트
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
import { DesktopPostItem } from './DesktopPostItem';
import { DesktopVirtualizedItem } from './DesktopVirtualizedItem';
import { PostListInFeedAdRow, PostListInFeedAd, POST_LIST_AD_INDEX } from '../shared/PostListInFeedAd';

/**
 * 데스크톱 게시글 리스트 컨테이너
 */
export function DesktopPostList({
  posts,
  currentPostId,
  currentBoardId,
  showBoard = true,
  variant = 'text',
  maxHeight,
}: Omit<PostListProps, 'loading' | 'emptyMessage' | 'headerContent' | 'footerContent' | 'className'>) {
  // React 18 동시성 기능: posts 데이터를 지연시켜 메인 스레드 블로킹 방지
  const deferredPosts = useDeferredValue(posts);

  // 가상화 사용 여부 결정
  const useVirtualization = deferredPosts.length > VIRTUALIZATION_THRESHOLD;

  // 가상화 리스트 높이 계산
  const listHeight = useMemo(() => {
    if (!maxHeight) return 400; // 기본값

    // sm: prefix 제거
    const cleanedHeight = maxHeight.startsWith('sm:')
      ? maxHeight.replace('sm:', '')
      : maxHeight;

    return calculateHeight(cleanedHeight);
  }, [maxHeight]);

  // 가상화 데이터 메모이제이션
  const virtualizedData = useMemo(
    () => ({
      posts: deferredPosts,
      currentPostId,
      currentBoardId,
      showBoard,
      variant,
    }),
    [deferredPosts, currentPostId, currentBoardId, showBoard, variant]
  );

  // 아이템 높이 계산
  const itemSize =
    variant === 'image-table'
      ? ITEM_HEIGHTS.DESKTOP_IMAGE_TABLE
      : ITEM_HEIGHTS.DESKTOP_TEXT;

  // image-table variant: 카드 리스트 (헤더 없음)
  if (variant === 'image-table') {
    // 가상화는 복잡도 때문에 text variant만 지원
    return (
      <div className="hidden sm:block">
        <div>
          {deferredPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <DesktopPostItem
                post={post}
                isLast={index === deferredPosts.length - 1}
                currentPostId={currentPostId}
                currentBoardId={currentBoardId}
                showBoard={showBoard}
                variant={variant}
              />
              {index === POST_LIST_AD_INDEX - 1 && <PostListInFeedAd />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // text variant: 테이블 형식
  if (useVirtualization) {
    // 가상화 렌더링
    return (
      <div className="hidden sm:block">
        {/* 테이블 헤더 */}
        <div className="flex border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          {showBoard && (
            <div
              className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
              style={{ width: '120px' }}
            >
              게시판
            </div>
          )}
          <div className="py-2 px-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400 flex-1">
            제목
          </div>
          <div
            className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            style={{ width: '120px' }}
          >
            글쓴이
          </div>
          <div
            className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            style={{ width: '80px' }}
          >
            날짜
          </div>
          <div
            className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            style={{ width: '60px' }}
          >
            조회
          </div>
          <div
            className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            style={{ width: '60px' }}
          >
            추천
          </div>
        </div>

        {/* 가상화된 리스트 */}
        <List
          height={listHeight - 40} // 헤더 높이 제외
          itemCount={deferredPosts.length}
          itemSize={itemSize}
          itemData={virtualizedData}
          overscanCount={VIRTUALIZATION_OVERSCAN_COUNT}
          width="100%"
        >
          {DesktopVirtualizedItem}
        </List>
      </div>
    );
  }

  // 일반 렌더링 (테이블)
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          {showBoard && <col style={{ width: '130px' }} />}
          <col />
          <col style={{ width: '120px' }} />
          <col style={{ width: '70px' }} />
          <col style={{ width: '40px' }} />
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
            {showBoard && (
              <th className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                게시판
              </th>
            )}
            <th className="py-2 px-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              제목
            </th>
            <th className="py-2 px-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              글쓴이
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              날짜
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              조회
            </th>
            <th className="py-2 px-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              추천
            </th>
          </tr>
        </thead>
        <tbody>
          {deferredPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <DesktopPostItem
                post={post}
                isLast={index === deferredPosts.length - 1}
                currentPostId={currentPostId}
                currentBoardId={currentBoardId}
                showBoard={showBoard}
                variant={variant}
              />
              {index === POST_LIST_AD_INDEX - 1 && (
                <PostListInFeedAdRow colSpan={showBoard ? 6 : 5} />
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

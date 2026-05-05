'use client';

import type { Post, PostVariant } from './types';
import { MobilePostList } from './components/mobile/MobilePostList';
import { DesktopPostList } from './components/desktop/DesktopPostList';

interface VirtualizedPostListProps {
  posts: Post[];
  currentPostId?: string;
  currentBoardId: string;
  showBoard: boolean;
  variant: PostVariant;
  maxHeight?: string;
}

export function VirtualizedPostList({
  posts,
  currentPostId,
  currentBoardId,
  showBoard,
  variant,
  maxHeight,
}: VirtualizedPostListProps) {
  return (
    <>
      <MobilePostList
        posts={posts}
        currentPostId={currentPostId}
        currentBoardId={currentBoardId}
        variant={variant}
        maxHeight={maxHeight}
      />
      <DesktopPostList
        posts={posts}
        currentPostId={currentPostId}
        currentBoardId={currentBoardId}
        showBoard={showBoard}
        variant={variant}
        maxHeight={maxHeight}
      />
    </>
  );
}

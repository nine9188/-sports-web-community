'use client';

import dynamic from 'next/dynamic';
import type { Post, PostVariant } from './types';

const MobilePostList = dynamic(
  () => import('./components/mobile/MobilePostList').then(m => ({ default: m.MobilePostList })),
  { ssr: false }
);
const DesktopPostList = dynamic(
  () => import('./components/desktop/DesktopPostList').then(m => ({ default: m.DesktopPostList })),
  { ssr: false }
);

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

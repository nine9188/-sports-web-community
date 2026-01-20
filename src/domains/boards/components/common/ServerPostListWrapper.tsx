// 이 파일은 서버 컴포넌트입니다 - 'use client' 지시어 없음
import React from 'react';
import { fetchPosts } from '@/domains/boards/actions';
import PostList from '@/domains/boards/components/post/PostList';
import { Suspense } from 'react';
import { Container } from '@/shared/components/ui';

// ServerPostList에 필요한 props 정의
interface ServerPostListWrapperProps {
  boardId?: string;
  boardIds?: string[];
  currentBoardId: string;
  limit?: number;
  showBoard?: boolean;
  currentPostId?: string;
  emptyMessage?: string;
  maxHeight?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  fromParam?: string;
  className?: string;
  boardNameMaxWidth?: string;
  initialPage?: number;
}

// 인라인 로딩 컴포넌트
function PostListSkeleton() {
  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      <div className="p-4 space-y-2">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
        ))}
      </div>
    </Container>
  );
}

// 서버 컴포넌트에서 데이터를 가져와 PostList 클라이언트 컴포넌트에 전달
export default async function ServerPostListWrapper({
  boardId,
  boardIds,
  currentPostId,
  emptyMessage,
  headerContent,
  footerContent,
  className = "mb-4",
  maxHeight,
  currentBoardId,
  boardNameMaxWidth,
  showBoard = true,
  fromParam,
  initialPage = 1
}: ServerPostListWrapperProps) {
  // 서버 액션을 사용하여 데이터 로드
  const postsData = await fetchPosts({
    boardId,
    boardIds,
    currentBoardId,
    page: initialPage,
    limit: 20,
    fromParam
  });
  
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostList 
        posts={postsData.data}
        loading={false}
        currentPostId={currentPostId}
        emptyMessage={emptyMessage}
        headerContent={headerContent}
        footerContent={footerContent}
        className={className}
        maxHeight={maxHeight}
        currentBoardId={currentBoardId}
        boardNameMaxWidth={boardNameMaxWidth}
        showBoard={showBoard}
      />
    </Suspense>
  );
} 
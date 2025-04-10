'use client';

import { useRef, useEffect } from 'react';
import { useIntersection } from '@/app/hooks/useIntersection';
import { useInfinitePosts } from '@/app/hooks/usePosts';
import PostList from '@/app/components/post/PostList';

interface ClientPostListProps {
  boardId?: string;
  boardIds?: string[];
  currentPostId?: string;
  emptyMessage?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  currentBoardId: string;
  boardNameMaxWidth?: string;
  showBoard?: boolean;
}

// API 응답 타입 정의
interface ApiPost {
  id: string;
  title: string;
  content?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  post_number?: number;
  user_id: string;
  board_id: string;
  writer?: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  board?: {
    id: string;
    name: string;
    slug: string;
  };
  team?: {
    id: number;
    name: string;
    country?: string;
    logo?: string;
  };
  league?: {
    id: number;
    name: string;
    country?: string;
    logo?: string;
  };
  is_current_board?: boolean;
}

// PostList 컴포넌트가 기대하는 포맷으로 변환
const formatPostData = (apiPosts: ApiPost[]) => {
  return apiPosts.map(post => ({
    id: post.id,
    title: post.title,
    board_id: post.board_id,
    board_name: post.board?.name || '',
    board_slug: post.board?.slug || '',
    post_number: post.post_number && post.post_number > 0 ? post.post_number : 1,
    created_at: post.created_at,
    views: post.view_count || 0,
    likes: post.like_count || 0,
    author_nickname: post.writer?.nickname || '익명',
    author_id: post.writer?.id,
    comment_count: post.comment_count || 0,
    content: post.content,
    team_id: post.team?.id,
    league_id: post.league?.id,
    team_logo: post.team?.logo,
    league_logo: post.league?.logo
  }));
};

export default function ClientPostList({
  boardId,
  boardIds,
  currentPostId,
  emptyMessage,
  headerContent,
  footerContent,
  className,
  maxHeight,
  currentBoardId,
  boardNameMaxWidth,
  showBoard = true,
}: ClientPostListProps) {
  // 무한 스크롤을 위한 훅 사용
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfinitePosts({
    boardId,
    boardIds,
    currentBoardId,
    limit: 10 // 한 번에 가져올 게시글 수 제한
  });
  
  // 무한 스크롤 감지를 위한 요소 참조
  const bottomRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersection(bottomRef);
  
  // 화면 하단 감지 시 다음 페이지 로드
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // 모든 페이지의 게시글을 하나의 배열로 병합하고 포맷 변환
  const apiPosts: ApiPost[] = data?.pages.flatMap(page => {
    // 데이터가 없을 경우 빈 배열 반환
    if (!page || !page.data) return [];
    
    // 데이터 타입 변환
    return page.data as unknown as ApiPost[];
  }) || [];
  
  const posts = formatPostData(apiPosts);
  
  // 에러 메시지
  if (isError) {
    console.error('게시글 로딩 오류:', error);
    return (
      <div className="p-4 text-red-500 text-center">
        게시글을 불러오는 데 문제가 발생했습니다.
        <p className="text-sm text-gray-500 mt-2">{(error as Error).message}</p>
      </div>
    );
  }
  
  return (
    <>
      <PostList
        posts={posts}
        loading={isLoading}
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
      
      {/* 무한 스크롤 감지 영역 */}
      {hasNextPage && (
        <div
          ref={bottomRef}
          className="py-4 text-center"
        >
          {isFetchingNextPage && (
            <div className="flex justify-center">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 
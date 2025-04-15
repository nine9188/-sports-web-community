'use client';

import { useState } from 'react';
import { usePosts } from '@/app/hooks/usePosts';
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
  fromParam?: string;
  initialPage?: number;
}

// API 응답 타입 정의
interface ApiPost {
  id: string;
  title: string;
  content?: string;
  view_count: number;  // 서버에서 post.views를 view_count로 변환하여 보내줌
  like_count: number;  // 서버에서 post.likes를 like_count로 변환하여 보내줌
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
  fromParam,
  initialPage = 1
}: ClientPostListProps) {
  const [page, setPage] = useState(initialPage);
  
  // 일반 쿼리 훅 사용 (무한 스크롤 제거)
  const {
    data,
    isLoading,
    isError,
    error
  } = usePosts({
    boardId,
    boardIds,
    currentBoardId,
    fromParam,
    page: page,
    limit: 15 // 한 페이지에 표시할 게시글 수
  });
  
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
  
  // API 응답 데이터 변환
  const apiPosts: ApiPost[] = data?.data || [];
  const posts = formatPostData(apiPosts);
  const totalPages = data?.meta?.totalPages || 1;
  
  // 페이지네이션 UI 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="py-3 flex justify-center space-x-2">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1}
          className={`px-3 py-1 rounded-md ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          이전
        </button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // 표시할 페이지 번호 계산 (현재 페이지 중심 이동)
            const pageToShow = Math.min(
              Math.max(page - 2 + i, i + 1),
              totalPages
            );
            return (
              <button
                key={pageToShow}
                onClick={() => setPage(pageToShow)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  page === pageToShow
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageToShow}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded-md ${page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          다음
        </button>
      </div>
    );
  };
  
  // 최종 footerContent 구성
  const combinedFooterContent = (
    <>
      {renderPagination()}
      {footerContent}
    </>
  );
  
  return (
    <PostList
      posts={posts}
      loading={isLoading}
      currentPostId={currentPostId}
      emptyMessage={emptyMessage}
      headerContent={headerContent}
      footerContent={combinedFooterContent}
      className={className || ''}
      maxHeight={maxHeight}
      currentBoardId={currentBoardId}
      boardNameMaxWidth={boardNameMaxWidth}
      showBoard={showBoard}
    />
  );
} 
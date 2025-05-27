import React from 'react';
import { notFound } from 'next/navigation';
import { getPostPageData } from '@/domains/boards/actions';
import PostDetailLayout from '@/domains/boards/components/layout/PostDetailLayout';
import ErrorMessage from '@/shared/ui/error-message';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PostDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string, postNumber: string }>,
  searchParams: Promise<{ from?: string, page?: string }>
}) {
  try {
    // 두 개의 비동기 값을 병렬로 처리
    const [{ slug, postNumber }, resolvedSearchParams] = await Promise.all([
      params,
      searchParams
    ]);
    
    // 이제 resolvedSearchParams에서 from 값 추출
    const fromBoardId = resolvedSearchParams?.from;
    
    // 특수 케이스 처리: 'undefined'가 문자열로 전달된 경우
    const normalizedFromBoardId = fromBoardId === 'undefined' ? undefined : fromBoardId;
    
    if (!slug || !postNumber) {
      return notFound();
    }
    
    // 서버 액션을 통해 모든 데이터 로드
    const result = await getPostPageData(slug, postNumber, normalizedFromBoardId);
    
    if (!result.success) {
      return (
        <ErrorMessage 
          message={result.error || '페이지를 불러오는 중 문제가 발생했습니다.'} 
        />
      );
    }
    
    // 결과가 성공적이고 모든 필요한 데이터가 있는지 확인
    if (!result.post || !result.board) {
      return (
        <ErrorMessage message="게시글 또는 게시판 정보가 없습니다." />
      );
    }
    
    // 타입 호환을 위한 데이터 변환
    const topLevelBoards = result.topLevelBoards?.map(board => ({
      id: board.id,
      name: board.name,
      display_order: board.display_order || 0,
      slug: board.slug || undefined // null을 undefined로 변환
    })) || [];
    
    // processedChildBoardsMap 변환 - null 값 제거 및 display_order 확인
    const processedChildBoardsMap: Record<string, Array<{
      id: string;
      name: string;
      parent_id: string; // null 허용하지 않음
      display_order: number; // null 허용하지 않음
      slug: string; // 필수 속성으로 변경
      team_id: number | null;
      league_id: number | null;
      description: string | null;
      access_level: string | null;
      logo: string | null;
      views: number | null;
    }>> = {};
    
    if (result.childBoardsMap) {
      Object.keys(result.childBoardsMap).forEach(key => {
        processedChildBoardsMap[key] = result.childBoardsMap[key].map(board => ({
          id: board.id,
          name: board.name,
          parent_id: board.parent_id || '',  // null을 빈 문자열로 변환
          display_order: board.display_order || 0, // null을 0으로 변환
          slug: board.slug || board.id,  // slug가 없는 경우 id를 기본값으로 사용
          team_id: board.team_id,  // null 허용
          league_id: board.league_id,  // null 허용
          description: board.description,  // null 허용
          access_level: board.access_level || null,
          logo: board.logo || null,
          views: board.views || null
        }));
      });
    }
    
    // CommentType 변환을 위한 처리
    const processedComments = (result.comments || []).map((comment: {
      id: string;
      content: string;
      created_at?: string;
      user_id?: string;
      post_id?: string;
      likes?: number;
      dislikes?: number;
      userAction?: 'like' | 'dislike' | null;
      profiles?: {
        nickname?: string;
        icon_id?: number;
      };
    }) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at || '',
      user_id: comment.user_id || '',
      post_id: comment.post_id || '',
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      userAction: comment.userAction || null,
      profiles: {
        nickname: comment.profiles?.nickname || null,
        id: comment.user_id || '',
        icon_id: comment.profiles?.icon_id || null,
        icon_url: null
      },
      children: []
    }));
    
    // formattedPosts 변환에 게시판 아이콘, 유저 레벨 및 아이콘 정보 추가
    const processedFormattedPosts = (result.formattedPosts || []).map(post => ({
      id: post.id,
      title: post.title,
      board_id: post.boardId,
      board_name: post.boardName,
      board_slug: post.boardSlug,
      post_number: post.postNumber,
      created_at: post.created_at,
      views: post.views,
      likes: post.likes,
      author_nickname: post.author,
      author_id: post.author_id || '',
      author_level: post.author_level || 1,
      author_icon_id: post.author_icon_id,
      author_icon_url: post.author_icon_url || undefined,  // null을 undefined로 변환
      comment_count: post.commentCount,
      // 팀/리그 정보
      team_id: post.team?.id || null,
      team_name: post.team?.name || null,
      team_logo: post.team?.logo || null,
      league_id: post.league?.id || null,
      league_name: post.league?.name || null,
      league_logo: post.league?.logo || null
    }));
    
    // post 데이터에 iconUrl과 icon_id 직접 설정
    const postWithIcon = {
      ...result.post,
      content: result.post.content as Record<string, unknown>,
      profiles: {
        ...result.post.profiles,
        icon_url: result.iconUrl
      }
    } as unknown;
    
    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <PostDetailLayout
        post={postWithIcon as Parameters<typeof PostDetailLayout>[0]['post']}
        board={result.board as Parameters<typeof PostDetailLayout>[0]['board']}
        breadcrumbs={result.breadcrumbs || []}
        comments={processedComments}
        isLoggedIn={result.isLoggedIn || false}
        isAuthor={result.isAuthor || false}
        adjacentPosts={result.adjacentPosts || { prevPost: null, nextPost: null }}
        formattedPosts={processedFormattedPosts}
        topLevelBoards={topLevelBoards}
        childBoardsMap={processedChildBoardsMap}
        rootBoardId={result.rootBoardId || ''}
        rootBoardSlug={result.rootBoardSlug || undefined}
        totalPages={result.totalPages || 1}
        currentPage={result.currentPage || 1}
        normalizedFromBoardId={result.normalizedFromBoardId}
        iconUrl={result.iconUrl || null}
        slug={slug}
        postNumber={postNumber}
      />
    );
  } catch (error) {
    // 오류가 NEXT_NOT_FOUND 관련인지 확인
    if (error instanceof Error && error.message?.includes('NEXT_NOT_FOUND')) {
      return notFound();
    }
    
    // 그 외 일반 오류는 사용자 친화적인 에러 페이지 표시
    return (
      <ErrorMessage message="페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." />
    );
  }
} 
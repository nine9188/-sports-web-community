'use client';

import React from 'react';
import Link from 'next/link';
import { CommentType } from '../../types/post/comment';
import { AdjacentPosts } from '../../types/post';
import { Breadcrumb } from '../../types/board/data';
import { ChildBoardsMap } from '../../types/board';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';
import PostNavigation from '../post/PostNavigation';
import PostHeader from '../post/PostHeader';
import PostContent from '../post/PostContent';
import PostActions from '../post/PostActions';
import CommentSection from '../post/CommentSection';
import HoverMenu from '../common/HoverMenu';
import PostList from '../post/PostList';
import PostFooter from '../post/PostFooter';
import Pagination from '../common/Pagination';

interface PostAuthor {
  nickname: string | null;
  id: string;
  icon_id: number | null;
  icon_url: string | null;
}

interface PostDetailLayoutProps {
  post: {
    id: string;
    title: string;
    content: Record<string, unknown>;
    user_id: string;
    created_at: string | null;
    views: number | null;
    likes: number | null;
    dislikes: number | null;
    board_id: string | null;
    post_number: number;
    profiles?: {
      nickname: string | null;
      icon_id: number | null;
    };
    board?: {
      name: string;
    };
    files?: Array<{
      url: string;
      filename: string;
    }>;
  };
  board: {
    id: string;
    name: string;
    slug: string;
  };
  breadcrumbs: Breadcrumb[];
  comments: CommentType[];
  isLoggedIn: boolean;
  isAuthor: boolean;
  adjacentPosts: AdjacentPosts;
  formattedPosts: Array<{
    id: string;
    title: string;
    board_id: string;
    board_name: string;
    board_slug: string;
    post_number: number;
    created_at: string;
    views: number;
    likes: number;
    author_nickname: string;
    comment_count: number;
  }>;
  topLevelBoards: Array<{
    id: string;
    name: string;
    display_order: number;
    slug?: string;
  }>;
  childBoardsMap: ChildBoardsMap;
  rootBoardId: string;
  rootBoardSlug?: string;
  totalPages: number;
  currentPage: number;
  normalizedFromBoardId?: string;
  iconUrl: string | null;
  slug: string;
  postNumber: string;
}

export default function PostDetailLayout({
  post,
  board,
  breadcrumbs,
  comments,
  isLoggedIn,
  isAuthor,
  adjacentPosts,
  formattedPosts,
  topLevelBoards,
  childBoardsMap,
  rootBoardId,
  rootBoardSlug,
  totalPages,
  currentPage,
  normalizedFromBoardId,
  iconUrl,
  slug,
  postNumber
}: PostDetailLayoutProps) {
  // 게시글 상세 정보 구성
  const author: PostAuthor = {
    nickname: post.profiles?.nickname || null,
    id: post.user_id,
    icon_id: post.profiles?.icon_id || null,
    icon_url: iconUrl
  };
  
  // 타입 호환성을 위해 직접 타입 변환
  const hoverMenuChildBoardsMap = Object.entries(childBoardsMap).reduce((acc, [key, boards]) => {
    acc[key] = boards.map(board => ({
      id: board.id,
      name: board.name,
      display_order: board.display_order || 0,
      slug: board.slug
    }));
    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    display_order: number;
    slug?: string;
  }[]>);
  
  // 댓글 타입 변환
  type AppCommentType = Parameters<typeof CommentSection>[0]['initialComments'][0];
  const processedComments = comments.map(c => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at || '',
    user_id: c.user_id || '',
    post_id: c.post_id || '',
    parent_id: c.parent_id,
    likes: c.likes,
    dislikes: c.dislikes,
    profiles: c.profiles ? {
      nickname: c.profiles.nickname,
      id: c.user_id || '',
      icon_id: c.profiles.icon_id,
      icon_url: null
    } : null
  } as AppCommentType));
  
  return (
    <div className="container mx-auto">
      {/* 1. 게시판 경로 - BoardBreadcrumbs 컴포넌트 사용 */}
      <div className="overflow-x-auto sm:mt-0 mt-4">
        <BoardBreadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      
      {/* 모바일 화면에서 우측 하단에 고정된 글쓰기 버튼 (로그인 시에만) */}
      {isLoggedIn && (
        <div className="sm:hidden fixed bottom-4 right-4 z-30">
          <Link href={`/boards/${slug}/create`}>
            <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium py-2 px-4 shadow-md border border-slate-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>글쓰기</span>
            </button>
          </Link>
        </div>
      )}
      
      {/* 2. 게시글 본문 (상세 정보) */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-4">
        {/* 게시글 헤더 컴포넌트 */}
        <PostHeader 
          title={post.title}
          author={author}
          createdAt={post.created_at || ''}
          views={post.views || 0}
          likes={post.likes || 0}
          boardName={post.board?.name || '게시판'}
          commentCount={comments?.length || 0}
        />
        
        {/* 게시글 본문 컴포넌트 */}
        <PostContent content={post.content || ''} />
        
        {/* 3. 추천/비추천 버튼 및 게시글 액션 */}
        <div className="px-4 sm:px-6 py-4 border-t">
          <div className="flex flex-col space-y-4">
            {/* 추천/비추천 버튼 */}
            <PostActions 
              postId={post.id} 
              boardId={board.id || ''} 
              initialLikes={post.likes || 0} 
              initialDislikes={post.dislikes || 0}
            />
          </div>
        </div>
        
        {/* 첨부파일 섹션 (있는 경우) */}
        {post.files && post.files.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t">
            <h3 className="text-sm font-medium mb-2">첨부파일</h3>
            <ul className="space-y-1">
              {post.files.map((file, index) => (
                <li key={index} className="text-sm">
                  <a 
                    href={file.url} 
                    className="text-blue-600 hover:underline flex items-center"
                    download
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span className="truncate">{file.filename}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 4. 게시글 하단 버튼 영역 */}
      <div className="mb-4">
        <PostFooter 
          boardSlug={slug}
          postNumber={postNumber}
          isAuthor={isAuthor}
          isLoggedIn={isLoggedIn}
          postId={post.id}
          userId={post.user_id}
        />
      </div>
      
      {/* 5. 포스트 네비게이션 */}
      <div className="mb-4">
        <PostNavigation 
          prevPost={adjacentPosts.prevPost} 
          nextPost={adjacentPosts.nextPost}
          boardSlug={slug}
        />
      </div>
      
      {/* 6. 댓글 섹션 */}
      <div className="mb-4">
        <CommentSection 
          postId={post.id} 
          initialComments={processedComments}
          boardSlug={slug}
          postNumber={postNumber}
          postOwnerId={post.user_id}
        />
      </div>
      
      {/* 7. 호버 메뉴 */}
      <div className="mb-4">
        <HoverMenu
          topBoards={topLevelBoards}
          childBoardsMap={hoverMenuChildBoardsMap}
          currentBoardId={board.id}
          rootBoardId={rootBoardId}
          rootBoardSlug={rootBoardSlug}
        />
      </div>
      
      {/* 8. 같은 게시판의 다른 글 목록 */}
      <div className="mb-4">
        <PostList 
          posts={formattedPosts}
          showBoard={true}
          currentBoardId={board.id}
          currentPostId={post.id}
        />
      </div>
      
      {/* 9. 게시글 푸터 (중복) */}
      <div className="mb-4">
        <PostFooter 
          boardSlug={slug}
          postNumber={postNumber}
          isAuthor={isAuthor}
          isLoggedIn={isLoggedIn}
          postId={post.id}
          userId={post.user_id}
        />
      </div>
      
      {/* 10. 페이지네이션 */}
      <div className="mb-4">
        {totalPages > 1 && (
          <div className="px-4 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              boardSlug={slug}
              fromBoardId={normalizedFromBoardId}
            />
          </div>
        )}
      </div>
    </div>
  );
} 
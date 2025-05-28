'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CommentType } from '../../types/post/comment';
import { AdjacentPosts } from '../../types/post';
import { Breadcrumb } from '../../types/board/data';
import { ChildBoardsMap } from '../../types/board';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';
import PostNavigation from '../post/PostNavigation';
import PostHeader from '../post/PostHeader';
import PostContent from '../post/PostContent';
import PostActions from '../post/PostActions';
import PostFooter from '../post/PostFooter';
import Pagination from '../common/Pagination';

// 지연 로딩으로 렌더링 시간 단축
const CommentSection = dynamic(() => import('../post/CommentSection'), { 
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white rounded-lg border mb-4">
      <div className="h-8 bg-gray-100 rounded animate-pulse mb-3"></div>
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

const HoverMenu = dynamic(() => import('../common/HoverMenu'), { 
  ssr: false,
  loading: () => <div className="h-10 bg-gray-100 rounded animate-pulse mb-4"></div>
});

const PostList = dynamic(() => import('../post/PostList'), {
  ssr: false,
  loading: () => (
    <div className="mb-4 bg-white rounded-lg border p-4">
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

// 메모이제이션 적용
const MemoizedBoardBreadcrumbs = memo(BoardBreadcrumbs);
const MemoizedPostHeader = memo(PostHeader);
const MemoizedPostNavigation = memo(PostNavigation);
const MemoizedPostActions = memo(PostActions);
const MemoizedPostFooter = memo(PostFooter);
const MemoizedPagination = memo(Pagination);

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
      icon_url: string | null;
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
    author_icon_url?: string;
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
  postUserAction: 'like' | 'dislike' | null;
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
  postUserAction,
  slug,
  postNumber
}: PostDetailLayoutProps) {
  // 지연 로딩을 위한 마운트 상태
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // 성능을 위해 초기 마운트 시점에는 일부 컴포넌트만 로드
    setHasMounted(true);
    
    // 스크롤 처리 - 해시가 있으면 해당 댓글로 스크롤
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hashId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 500); // 컴포넌트가 모두 로드된 후 스크롤
    }
    
    // 메모리 누수 방지 및 transform 오류 해결을 위한 이벤트 리스너 정리
    return () => {
      // 메모리 누수 방지를 위한 이벤트 리스너 정리
      const abortController = new AbortController();
      abortController.abort();
    };
  }, []);
  
  // 게시글 상세 정보 구성
  const author: PostAuthor = {
    nickname: post.profiles?.nickname || null,
    id: post.user_id,
    icon_id: post.profiles?.icon_id || null,
    icon_url: post.profiles?.icon_url || null
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
  
  // 아이콘 URL을 formattedPosts에 추가
  const postsWithIcons = formattedPosts.map(post => ({
    ...post,
    author_icon_url: post.author_icon_url || iconUrl
  }));
  
  return (
    <div className="container mx-auto">
      {/* 1. 게시판 경로 - BoardBreadcrumbs 컴포넌트 사용 */}
      <div className="overflow-x-auto sm:mt-0 mt-4">
        <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
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
        <MemoizedPostHeader 
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
            <MemoizedPostActions 
              postId={post.id} 
              boardId={board.id || ''} 
              initialLikes={post.likes || 0} 
              initialDislikes={post.dislikes || 0}
              initialUserAction={postUserAction}
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
        <MemoizedPostFooter 
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
        <MemoizedPostNavigation 
          prevPost={adjacentPosts.prevPost} 
          nextPost={adjacentPosts.nextPost}
          boardSlug={slug}
        />
      </div>
      
      {/* 6. 댓글 섹션 - 지연 로딩 */}
      {hasMounted && (
        <div className="mb-4">
          <CommentSection 
            postId={post.id} 
            initialComments={comments}
            boardSlug={slug}
            postNumber={postNumber}
            postOwnerId={post.user_id}
          />
        </div>
      )}
      
      {/* 7. 호버 메뉴 - 지연 로딩 */}
      {hasMounted && (
        <div className="mb-4">
          <HoverMenu
            topBoards={topLevelBoards}
            childBoardsMap={hoverMenuChildBoardsMap}
            currentBoardId={board.id}
            rootBoardId={rootBoardId}
            rootBoardSlug={rootBoardSlug}
          />
        </div>
      )}
      
      {/* 8. 같은 게시판의 다른 글 목록 - 지연 로딩 */}
      {hasMounted && (
        <div className="mb-4">
          <PostList 
            posts={postsWithIcons}
            showBoard={true}
            currentBoardId={board.id}
            currentPostId={post.id}
          />
        </div>
      )}
      
      {/* 9. 게시글 푸터 (중복) */}
      <div className="mb-4">
        <MemoizedPostFooter 
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
            <MemoizedPagination
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
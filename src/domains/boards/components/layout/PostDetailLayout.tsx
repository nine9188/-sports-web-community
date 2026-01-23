"use client";

import React, { memo, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CommentType } from "../../types/post/comment";
import { AdjacentPosts } from "../../types/post";
import { Breadcrumb } from "../../types/board/data";
import { ChildBoardsMap } from "../../types/board";
import BoardBreadcrumbs from "../common/BoardBreadcrumbs";
import PostNavigation from "../post/PostNavigation";
import PostHeader from "../post/PostHeader";
import PostContent from "../post/PostContent";
import PostActions from "../post/PostActions";
import PostFooter from "../post/PostFooter";
import { Container, Pagination } from "@/shared/components/ui";
import CommentSection from "../post/CommentSection";
import PostList from "../post/PostList";
import { HotdealInfoBox } from "../hotdeal";
import type { DealInfo } from "../../types/hotdeal";

// 호버 메뉴만 지연 로딩 (덜 중요한 컴포넌트)
const HoverMenu = dynamic(() => import("../common/HoverMenu"), {
  ssr: false,
  loading: () => (
    <div className="h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse mb-4"></div>
  ),
});

// 메모이제이션 적용
const MemoizedBoardBreadcrumbs = memo(BoardBreadcrumbs);
const MemoizedPostHeader = memo(PostHeader);
const MemoizedPostNavigation = memo(PostNavigation);
const MemoizedPostActions = memo(PostActions);
const MemoizedPostFooter = memo(PostFooter);
const MemoizedPagination = memo(Pagination);
const MemoizedCommentSection = memo(CommentSection);
const MemoizedPostList = memo(PostList);

interface PostAuthor {
  nickname: string | null;
  id: string;
  public_id?: string | null;
  level?: number;
  icon_id: number | null;
  icon_url: string | null;
}

interface PostDetailLayoutProps {
  post: {
    id: string;
    title: string;
    content: Record<string, unknown>;
    meta?: Record<string, unknown> | null;
    user_id: string;
    created_at: string | null;
    views: number | null;
    likes: number | null;
    dislikes: number | null;
    board_id: string | null;
    post_number: number;
    is_hidden?: boolean;
    is_deleted?: boolean;
    deal_info?: DealInfo | null;
    profiles?: {
      nickname: string | null;
      public_id?: string | null;
      level?: number;
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
  currentUserId?: string | null;
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
    content?: string;
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
  postUserAction: "like" | "dislike" | null;
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
  currentUserId,
  adjacentPosts,
  formattedPosts,
  topLevelBoards,
  childBoardsMap,
  rootBoardId,
  rootBoardSlug,
  totalPages,
  currentPage,
  postUserAction,
  slug,
  postNumber,
}: PostDetailLayoutProps) {
  // 지연 로딩을 위한 마운트 상태
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // 호버 메뉴 지연 로딩
    setHasMounted(true);

    // 스크롤 처리 - 해시가 있으면 해당 댓글로 스크롤
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hashId);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100); // 댓글이 즉시 로드되므로 시간 단축
    }
  }, []);

  // 게시글 상세 정보 구성
  const author: PostAuthor = {
    nickname: post.profiles?.nickname || null,
    id: post.user_id,
    public_id: post.profiles?.public_id || null,
    level: post.profiles?.level,
    icon_id: post.profiles?.icon_id || null,
    icon_url: post.profiles?.icon_url || null,
  };

  // 타입 호환성을 위해 직접 타입 변환
  const hoverMenuChildBoardsMap = Object.entries(childBoardsMap).reduce(
    (acc, [key, boards]) => {
      acc[key] = boards.map((board) => ({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug,
      }));
      return acc;
    },
    {} as Record<
      string,
      {
        id: string;
        name: string;
        display_order: number;
        slug?: string;
      }[]
    >,
  );

  // 아이콘 URL을 formattedPosts에 추가 - 각 게시글 작성자의 고유한 아이콘 유지
  const postsWithIcons = formattedPosts.map((post) => ({
    ...post,
    // 이미 author_icon_url이 있으면 그대로 사용, 없으면 기본 아이콘도 사용하지 않음
    author_icon_url: post.author_icon_url || undefined,
  }));

  // 게시글 상태 확인
  const isPostHidden = post.is_hidden === true;
  const isPostDeleted = post.is_deleted === true;

  // 삭제된 게시글인 경우 특별한 UI 표시
  if (isPostDeleted) {
    return (
      <div className="container mx-auto">
        {/* 게시판 경로 */}
        <div className="overflow-x-auto sm:mt-0 mt-4">
          <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
        </div>

        {/* 삭제된 게시글 메시지 */}
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-red-400 dark:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            신고에 의해 삭제된 게시글
          </h2>
          <p className="text-red-600 dark:text-red-500">
            이 게시글은 신고 처리로 인해 삭제되었습니다.
          </p>
          <div className="mt-6">
            <Link
              href={`/boards/${slug}`}
              className="inline-flex items-center px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
            >
              게시판으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 숨김 처리된 게시글인 경우 특별한 UI 표시
  if (isPostHidden) {
    return (
      <div className="container mx-auto">
        {/* 게시판 경로 */}
        <div className="overflow-x-auto sm:mt-0 mt-4">
          <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
        </div>

        {/* 숨김 처리된 게시글 메시지 */}
        <div className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-0 p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">
            신고에 의해 숨김 처리된 게시글
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            이 게시글은 신고 처리로 인해 일시적으로 숨김 처리되었습니다.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            7일 후 다시 검토됩니다.
          </p>
          <div className="mt-6">
            <Link
              href={`/boards/${slug}`}
              className="inline-flex items-center px-4 py-2 bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] rounded-md transition-colors"
            >
              게시판으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* 1. 게시판 경로 - BoardBreadcrumbs 컴포넌트 사용 */}
      <div className="overflow-x-auto">
        <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      {/* 2. 게시글 본문 (상세 정보) */}
      <Container className="bg-white dark:bg-[#1D1D1D] shadow-sm mb-4">
        {/* 게시글 헤더 컴포넌트 */}
        <MemoizedPostHeader
          title={post.title}
          author={author}
          createdAt={post.created_at || ""}
          views={post.views || 0}
          likes={post.likes || 0}
          boardName={post.board?.name || "게시판"}
          commentCount={comments?.length || 0}
          isEnded={Boolean(post.deal_info?.is_ended)}
        />

        {/* 핫딜 정보박스 - 핫딜 게시판일 때만 표시 */}
        {post.deal_info && (
          <div className="px-4 sm:px-6 py-4 border-t border-black/5 dark:border-white/10">
            <HotdealInfoBox
              dealInfo={post.deal_info}
              postId={post.id}
              isAuthor={isAuthor}
            />
          </div>
        )}

        {/* 게시글 본문 컴포넌트 */}
        <PostContent content={post.content || ""} meta={post.meta || null} />

        {/* 3. 추천/비추천 버튼 및 게시글 액션 */}
        <div className="px-4 sm:px-6 py-4 border-t border-black/5 dark:border-white/10">
          <div className="flex flex-col space-y-4">
            {/* 추천/비추천 버튼 */}
            <MemoizedPostActions
              postId={post.id}
              boardId={board.id || ""}
              initialLikes={post.likes || 0}
              initialDislikes={post.dislikes || 0}
              initialUserAction={postUserAction}
            />
          </div>
        </div>

        {/* 첨부파일 섹션 (있는 경우) */}
        {post.files && post.files.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-black/5 dark:border-white/10">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-[#F0F0F0]">
              첨부파일
            </h3>
            <ul className="space-y-1">
              {post.files.map((file, index) => (
                <li key={index} className="text-sm">
                  <a
                    href={file.url}
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 hover:underline flex items-center transition-colors"
                    download
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <span className="truncate">{file.filename}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>

      {/* 4. 게시글 하단 버튼 영역 */}
      <MemoizedPostFooter
        boardSlug={slug}
        postNumber={postNumber}
        isAuthor={isAuthor}
        isLoggedIn={isLoggedIn}
        postId={post.id}
        userId={post.user_id}
        withMargin={true}
      />

      {/* 5. 포스트 네비게이션 */}
      <div className="mb-4">
        <MemoizedPostNavigation
          prevPost={adjacentPosts.prevPost}
          nextPost={adjacentPosts.nextPost}
          boardSlug={slug}
        />
      </div>

      {/* 6. 댓글 섹션 - 즉시 로딩 */}
      <div className="mb-4">
        <MemoizedCommentSection
          postId={post.id}
          postOwnerId={post.user_id}
          currentUserId={currentUserId}
        />
      </div>

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

      {/* 8. 같은 게시판의 다른 글 목록 - 즉시 로딩 */}
      <div className="mb-4">
        <MemoizedPostList
          posts={postsWithIcons}
          showBoard={true}
          currentBoardId={board.id}
          currentPostId={post.id}
        />
      </div>

      {/* 9. 게시글 푸터 (중복) */}
      <MemoizedPostFooter
        boardSlug={slug}
        postNumber={postNumber}
        isAuthor={isAuthor}
        isLoggedIn={isLoggedIn}
        postId={post.id}
        userId={post.user_id}
        withMargin={totalPages > 1}
      />

      {/* 10. 페이지네이션 */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 mt-4">
          <MemoizedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            mode="url"
            withMargin={false}
          />
        </div>
      )}
    </div>
  );
}

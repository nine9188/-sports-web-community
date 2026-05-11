"use client";

import { useMemo, useState, useTransition } from "react";
import { Pagination } from "@/shared/components/ui";
import PostList from "../post/PostList";
import { getPostDetailListPageData } from "../../actions/getPostDetails";

interface RelatedPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate?: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string | null;
  author_level?: number;
  author_exp?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  comment_count: number;
  content?: string;
  team_id?: string | number | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: string | number | null;
  league_name?: string | null;
  league_logo?: string | null;
  league_logo_dark?: string | null;
}

interface PostDetailRelatedListProps {
  initialPosts: RelatedPost[];
  initialCurrentPage: number;
  totalPages: number;
  boardId: string;
  currentPostId: string;
  slug: string;
  postNumber: string;
}

export default function PostDetailRelatedList({
  initialPosts,
  initialCurrentPage,
  totalPages,
  boardId,
  currentPostId,
  slug,
  postNumber,
}: PostDetailRelatedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [pageCount, setPageCount] = useState(totalPages);
  const [isPending, startTransition] = useTransition();

  const postsWithIcons = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        author_icon_url: post.author_icon_url || undefined,
        team_id: post.team_id,
        league_id: post.league_id,
        team_logo: post.team_logo,
        league_logo: post.league_logo,
        league_logo_dark: post.league_logo_dark,
      })),
    [posts],
  );

  const updateUrl = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("listPage", String(page));
    window.history.pushState(null, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage || isPending) return;

    startTransition(async () => {
      const result = await getPostDetailListPageData(slug, postNumber, page);
      if (!result.success) return;

      const nextPosts = result.formattedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        board_id: post.boardId,
        board_name: post.boardName,
        board_slug: post.boardSlug,
        post_number: post.postNumber,
        created_at: post.created_at,
        formattedDate: post.formattedDate,
        views: post.views,
        likes: post.likes,
        author_nickname: post.author,
        author_id: post.author_id || "",
        author_public_id: post.author_public_id || null,
        author_level: post.author_level || 1,
        author_exp: post.author_exp,
        author_icon_id: post.author_icon_id,
        author_icon_url: post.author_icon_url || undefined,
        comment_count: post.commentCount,
        content: post.content,
        team_id: post.team?.id || null,
        team_name: post.team?.name || null,
        team_logo: post.team?.logo || null,
        league_id: post.league?.id || null,
        league_name: post.league?.name || null,
        league_logo: post.league?.logo || null,
        league_logo_dark: post.league?.logo_dark || null,
      }));

      setPosts(nextPosts);
      setCurrentPage(result.currentPage);
      setPageCount(result.totalPages);
      updateUrl(result.currentPage);
    });
  };

  return (
    <>
      <div className={`mb-4 ${isPending ? "opacity-60" : ""}`}>
        <PostList
          posts={postsWithIcons}
          showBoard={true}
          currentBoardId={boardId}
          currentPostId={currentPostId}
          currentPage={currentPage}
        />
      </div>

      {pageCount > 1 && (
        <div className="px-4 sm:px-6 mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            mode="button"
            onPageChange={handlePageChange}
            withMargin={false}
          />
        </div>
      )}
    </>
  );
}

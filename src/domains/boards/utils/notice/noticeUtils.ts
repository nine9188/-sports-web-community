/**
 * 공지사항 처리 유틸리티
 * 기존 page.tsx의 133-198줄 로직을 분리
 */

import type { LayoutPost, ApiPost } from '../../types/post/layout';
import type { Post } from '../../types/post';
import { convertApiPostsToLayoutPosts } from '../post/postUtils';

export interface BoardInfo {
  id: string;
  slug: string;
  name: string;
}

export interface PostsResponse {
  data: ApiPost[] | null;
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
}

export interface NoticesData {
  allNotices: Post[];      // 모든 공지 (공지 게시판용)
  headerNotices: Post[];   // 헤더용 공지 (전체 공지 + 해당 게시판 공지)
  boardNotices: Post[];    // 일반 게시판용 공지
}

export interface Pagination {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

export interface ProcessedNoticesResult {
  posts: LayoutPost[];
  notices: Post[];
  pagination: Pagination;
}

/**
 * 공지사항 게시판인지 확인
 */
export function isNoticeBoardSlug(slug: string): boolean {
  return slug === 'notice' || slug === 'notices';
}

/**
 * 공지사항 데이터를 LayoutPost 형식으로 변환
 */
export function convertNoticesToLayoutPosts(notices: Post[]): LayoutPost[] {
  return notices.map((notice) => {
    const content = typeof notice.content === 'string'
      ? notice.content
      : notice.content ? JSON.stringify(notice.content) : undefined;

    const teamId = typeof notice.team_id === 'string'
      ? parseInt(notice.team_id, 10)
      : notice.team_id ?? null;
    const leagueId = typeof notice.league_id === 'string'
      ? parseInt(notice.league_id, 10)
      : notice.league_id ?? null;

    return {
      id: notice.id,
      title: notice.title || '',
      board_id: notice.board_id || '',
      board_name: notice.board_name || (notice as any).board?.name || '',
      board_slug: notice.board_slug || (notice as any).board?.slug || notice.board_id || '',
      post_number: notice.post_number || 0,
      created_at: notice.created_at || '',
      formattedDate: notice.formattedDate || '',
      views: notice.views ?? 0,
      likes: notice.likes ?? 0,
      author_nickname: notice.author_nickname || (notice as any).profiles?.nickname || '익명',
      author_id: notice.user_id,
      author_public_id: notice.author_public_id ?? (notice as any).profiles?.public_id ?? null,
      author_icon_id: (notice as any).profiles?.icon_id ?? null,
      author_icon_url: notice.author_icon_url ?? null,
      author_level: notice.author_level || (notice as any).profiles?.level || 1,
      comment_count: notice.comment_count ?? 0,
      content,
      team_id: teamId,
      league_id: leagueId
    };
  });
}

/**
 * 게시판 유형에 따라 공지사항과 게시글을 처리
 *
 * - 공지사항 게시판: 모든 공지를 게시글로 표시, 헤더는 해당 게시판 공지만
 * - 일반 게시판: 일반 게시글 표시, 헤더에 전체 공지 + 해당 게시판 공지
 */
export function processNoticesForLayout(
  boardData: BoardInfo,
  postsData: PostsResponse,
  noticesData: NoticesData
): ProcessedNoticesResult {
  const isNoticeBoard = isNoticeBoardSlug(boardData.slug);

  if (isNoticeBoard) {
    // 공지사항 게시판: 모든 공지를 게시글 목록으로 표시
    const noticePosts = convertNoticesToLayoutPosts(noticesData.allNotices);

    return {
      posts: noticePosts,
      notices: noticesData.headerNotices,
      pagination: {
        totalItems: noticesData.allNotices.length,
        itemsPerPage: noticesData.allNotices.length,
        currentPage: 1
      }
    };
  } else {
    // 일반 게시판: 일반 게시글 표시
    const layoutPosts = convertApiPostsToLayoutPosts(postsData.data || []);

    return {
      posts: layoutPosts,
      notices: noticesData.boardNotices,
      pagination: {
        totalItems: postsData.meta.totalItems,
        itemsPerPage: postsData.meta.itemsPerPage,
        currentPage: postsData.meta.currentPage
      }
    };
  }
}

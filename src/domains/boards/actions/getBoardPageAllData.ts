'use server';

import { getBoardPageData } from './getBoards';
import { fetchPosts } from './getPosts';
import { getBoardPopularPosts, type PopularPost } from './getPopularPosts';
import { getNoticesForBoard } from './posts';
import { getHoverMenuData, type HoverMenuBoard } from './getHoverMenuData';
import { processNoticesForLayout } from '../utils/notice/noticeUtils';
import type { LayoutPost } from '../types/post/layout';
import type { Post } from '../types/post';

export interface BoardPageAllData {
  // 게시판 정보
  boardData: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    parent_id?: string | null;
    team_id?: number | null;
    league_id?: number | null;
    view_type?: string | null;
    logo?: string | null;
    [key: string]: unknown;
  };
  breadcrumbs: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  teamData: {
    team: {
      id: number;
      name: string;
      country: string;
      founded: number;
      logo: string;
    };
    venue: {
      name: string;
      city: string;
      capacity: number;
    };
  } | null;
  leagueData: {
    id: number;
    name: string;
    country: string;
    logo: string;
  } | null;
  isLoggedIn: boolean;
  rootBoardId: string;
  rootBoardSlug: string;
  viewType: string | null;

  // 게시글 정보
  posts: LayoutPost[];
  pagination: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
  popularPosts: PopularPost[];
  notices: Post[];

  // HoverMenu 정보
  topBoards: HoverMenuBoard[];
  hoverChildBoardsMap: Record<string, HoverMenuBoard[]>;
}

export interface BoardPageError {
  error: string;
  notFound?: boolean;
}

/**
 * 게시판 페이지에 필요한 모든 데이터를 통합 fetch
 *
 * 기존 page.tsx에서 여러 번 호출하던 것을 하나로 통합:
 * - getBoardPageData()
 * - fetchPosts()
 * - getBoardPopularPosts()
 * - getNotices() (여러 번)
 * - getSupabaseServer() (HoverMenu용)
 */
export async function getBoardPageAllData(
  slug: string,
  currentPage: number,
  fromParam?: string,
  store?: string
): Promise<BoardPageAllData | BoardPageError> {
  // 1. 기본 게시판 데이터 fetch
  const boardResult = await getBoardPageData(slug, currentPage, fromParam);

  if (!boardResult.success) {
    return {
      error: boardResult.error || '게시판을 찾을 수 없습니다.',
      notFound: true
    };
  }

  if (!boardResult.boardData) {
    return {
      error: `요청하신 '${slug}' 게시판이 존재하지 않습니다.`,
      notFound: true
    };
  }

  const boardData = boardResult.boardData;

  // 2. 나머지 데이터 병렬 fetch
  const [postsData, popularPosts, noticesData, hoverMenuData] = await Promise.all([
    fetchPosts({
      boardIds: boardResult.filteredBoardIds,
      currentBoardId: boardData.id,
      page: currentPage,
      limit: 20,
      fromParam,
      store
    }),
    getBoardPopularPosts(boardData.id),
    getNoticesForBoard({
      id: boardData.id,
      slug: boardData.slug || ''
    }),
    getHoverMenuData(boardResult.rootBoardId || '')
  ]);

  // 3. 공지사항과 게시글 데이터 처리
  const { posts, notices, pagination } = processNoticesForLayout(
    {
      id: boardData.id,
      slug: boardData.slug || '',
      name: boardData.name
    },
    {
      data: postsData.data,
      meta: {
        totalItems: postsData.meta.totalItems,
        itemsPerPage: postsData.meta.itemsPerPage,
        currentPage: postsData.meta.currentPage
      }
    },
    noticesData
  );

  // 4. 통합 데이터 반환
  return {
    boardData: {
      ...boardData,
      slug: boardData.slug || ''
    },
    breadcrumbs: boardResult.breadcrumbs || [],
    teamData: boardResult.teamData || null,
    leagueData: boardResult.leagueData || null,
    isLoggedIn: boardResult.isLoggedIn || false,
    rootBoardId: boardResult.rootBoardId || '',
    rootBoardSlug: boardResult.rootBoardSlug || '',
    viewType: boardData.view_type || null,
    posts,
    pagination,
    popularPosts,
    notices,
    topBoards: hoverMenuData.topBoards,
    hoverChildBoardsMap: hoverMenuData.childBoardsMap
  };
}

'use client';

import PeriodFilter from '@/domains/boards/components/common/PeriodFilter';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { Board } from '@/domains/boards/types/board';
import { Breadcrumb } from '@/domains/boards/types/board/data';

// Post 타입 정의
interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string | null;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count: number;
  content?: string;
  team_id?: number | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: number | null;
  league_name?: string | null;
  league_logo?: string | null;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface Pagination {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

interface PopularPageClientProps {
  boardData: Board;
  breadcrumbs: Breadcrumb[];
  currentPage: number;
  posts: Post[];
  topBoards: TopBoard[];
  hoverChildBoardsMap: Record<string, ChildBoard[]>;
  pagination: Pagination;
  period: string;
}

export default function PopularPageClient({
  boardData,
  breadcrumbs,
  currentPage,
  posts,
  topBoards,
  hoverChildBoardsMap,
  pagination,
  period
}: PopularPageClientProps) {
  return (
    <BoardDetailLayout
      boardData={boardData}
      breadcrumbs={breadcrumbs}
      teamData={null}
      leagueData={null}
      isLoggedIn={false}
      currentPage={currentPage}
      slug="popular"
      rootBoardId="popular"
      rootBoardSlug="popular"
      posts={posts}
      topBoards={topBoards}
      hoverChildBoardsMap={hoverChildBoardsMap}
      pagination={pagination}
      filterComponent={<PeriodFilter currentPeriod={period} />}
      listVariant="card"
    />
  );
}

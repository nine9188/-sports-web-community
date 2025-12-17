'use client';

import PeriodFilter from '@/domains/boards/components/common/PeriodFilter';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';

interface PopularPageClientProps {
  boardData: any;
  breadcrumbs: any[];
  currentPage: number;
  posts: any[];
  topBoards: any[];
  hoverChildBoardsMap: any;
  pagination: any;
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
      popularPosts={{ todayPosts: [], weekPosts: [] }}
      filterComponent={<PeriodFilter currentPeriod={period} />}
      listVariant="card"
    />
  );
}

import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';

interface HotdealBoardPageProps {
  slug: string;
  searchParams: Promise<{ page?: string; from?: string; store?: string }>;
}

export default async function HotdealBoardPage({ slug, searchParams }: HotdealBoardPageProps) {
  try {
    const { page = '1', from: fromParam, store } = await searchParams;
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
      ? 1
      : parseInt(page, 10);

    const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

    if ('error' in result) {
      return (
        <BoardDetailLayout
          boardData={{ id: slug, name: slug, slug, description: null, parent_id: null, team_id: null, league_id: null, display_order: 0, views: 0, access_level: null, logo: null }}
          breadcrumbs={[]}
          teamData={null}
          leagueData={null}
          isLoggedIn={false}
          canWrite={false}
          currentPage={1}
          slug={slug}
          rootBoardId={slug}
          rootBoardSlug={slug}
          posts={[]}
          topBoards={[]}
          hoverChildBoardsMap={{}}
          pagination={{ totalItems: 0, itemsPerPage: 20, currentPage: 1 }}
        />
      );
    }

    return (
      <BoardDetailLayout
        boardData={{
          ...result.boardData,
          slug: result.boardData.slug || ''
        }}
        breadcrumbs={result.breadcrumbs}
        teamData={result.teamData}
        leagueData={result.leagueData ? {
          ...result.leagueData,
          type: 'league'
        } : null}
        isLoggedIn={result.isLoggedIn}
        isAdmin={result.isAdmin}
        canWrite={result.canWrite}
        currentPage={currentPage}
        slug={slug}
        rootBoardId={result.rootBoardId}
        rootBoardSlug={result.rootBoardSlug}
        viewType={result.viewType}
        posts={result.posts}
        topBoards={result.topBoards}
        hoverChildBoardsMap={result.hoverChildBoardsMap}
        pagination={result.pagination}
        popularPosts={result.popularPosts}
        notices={result.notices}
        teamLogoUrl={result.teamLogoUrl}
        leagueLogoUrl={result.leagueLogoUrl}
        leagueLogoUrlDark={result.leagueLogoUrlDark}
      />
    );
  } catch (error) {
    console.error("HotdealBoardPage Error:", error);
    return (
      <BoardDetailLayout
        boardData={{ id: slug, name: slug, slug, description: null, parent_id: null, team_id: null, league_id: null, display_order: 0, views: 0, access_level: null, logo: null }}
        breadcrumbs={[]}
        teamData={null}
        leagueData={null}
        isLoggedIn={false}
        canWrite={false}
        currentPage={1}
        slug={slug}
        rootBoardId={slug}
        rootBoardSlug={slug}
        posts={[]}
        topBoards={[]}
        hoverChildBoardsMap={{}}
        pagination={{ totalItems: 0, itemsPerPage: 20, currentPage: 1 }}
      />
    );
  }
}

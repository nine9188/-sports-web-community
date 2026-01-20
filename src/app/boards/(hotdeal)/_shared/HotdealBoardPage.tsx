import Link from 'next/link';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';

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
      if (result.notFound) {
        return (
          <div className="container mx-auto">
            <div className={errorBoxStyles}>
              <h2 className={errorTitleStyles}>게시판을 찾을 수 없습니다</h2>
              <p className={errorMessageStyles}>{result.error}</p>
              <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
            </div>
          </div>
        );
      }
      return (
        <div className="container mx-auto">
          <div className={errorBoxStyles}>
            <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
            <p className={errorMessageStyles}>{result.error}</p>
            <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
          </div>
        </div>
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
      />
    );
  } catch (error) {
    console.error("HotdealBoardPage Error:", error);
    return (
      <div className="container mx-auto">
        <div className={errorBoxStyles}>
          <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
          <p className={errorMessageStyles}>게시판 정보를 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
        </div>
      </div>
    );
  }
}

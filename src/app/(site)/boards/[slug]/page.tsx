import { Metadata } from 'next';
import Link from 'next/link';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import { searchBoardPosts } from '@/domains/boards/actions/posts';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 게시판 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  // 게시판 정보 조회
  const { data: board } = await supabase
    .from('boards')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!board) {
    return buildMetadata({
      title: '게시판을 찾을 수 없습니다',
      description: '요청하신 게시판이 존재하지 않습니다.',
      path: `/boards/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: board.name,
    description: board.description || `${board.name} 게시판의 최신 글을 확인하세요.`,
    path: `/boards/${slug}`,
  });
}

export default async function BoardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string; store?: string; search?: string; searchType?: string }>
}) {
  try {
    // 1. 파라미터 추출
    const { slug } = await params;
    const { page = '1', from: fromParam, store, search, searchType } = await searchParams;
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
      ? 1
      : parseInt(page, 10);
    const searchQuery = search?.trim() || '';

    // 2. 통합 데이터 fetch (단일 호출)
    const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

    // 3. 에러 처리
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

    // 4. 검색 모드인 경우 검색 결과로 대체
    let posts = result.posts;
    let pagination = result.pagination;

    if (searchQuery) {
      const validSearchTypes = ['title_content', 'title', 'content', 'comment', 'nickname'] as const;
      type ValidSearchType = (typeof validSearchTypes)[number];
      const isValidSearchType = (value: string | undefined): value is ValidSearchType =>
        typeof value === 'string' && (validSearchTypes as readonly string[]).includes(value);
      const searchTypeValue: ValidSearchType = isValidSearchType(searchType)
        ? searchType
        : 'title_content';

      const searchResult = await searchBoardPosts({
        boardIds: result.filteredBoardIds,
        query: searchQuery,
        searchType: searchTypeValue,
        page: currentPage,
        limit: 30,
      });

      posts = convertApiPostsToLayoutPosts(searchResult.data);
      pagination = {
        totalItems: searchResult.meta.totalItems,
        itemsPerPage: searchResult.meta.itemsPerPage,
        currentPage: searchResult.meta.currentPage,
      };
    }

    // 5. 레이아웃 렌더링
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
        posts={posts}
        topBoards={result.topBoards}
        hoverChildBoardsMap={result.hoverChildBoardsMap}
        pagination={pagination}
        popularPosts={searchQuery ? undefined : result.popularPosts}
        notices={searchQuery ? undefined : result.notices}
        searchQuery={searchQuery}
        teamLogoUrl={result.teamLogoUrl}
        leagueLogoUrl={result.leagueLogoUrl}
        leagueLogoUrlDark={result.leagueLogoUrlDark}
      />
    );
  } catch (error) {
    console.error("BoardDetailPage Error:", error);
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

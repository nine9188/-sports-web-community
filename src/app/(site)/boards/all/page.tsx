import Link from 'next/link';
import { fetchPosts } from '@/domains/boards/actions';
import { getGlobalHoverMenuData } from '@/domains/boards/actions/getHoverMenuData';
import { getNotices } from '@/domains/boards/actions/posts/notices';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getBoardListMetadataState } from '../_shared/boardListMetadata';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const metadataState = getBoardListMetadataState('/boards/all', await searchParams);

  return buildMetadata({
    title: '전체글 - 해외축구·국내축구 게시판',
    description: '해외축구, 국내축구, 축구 분석, 자유게시판 등 모든 게시판의 최신 글을 한곳에서 확인하세요. 축구 커뮤니티 4590 Football.',
    path: metadataState.path,
    keywords: ['해외축구 게시판', '국내축구 게시판', '축구 분석 커뮤니티', '축구 커뮤니티', '4590', '4590football', '해외축구', '국내축구'],
    ...(metadataState.robots && { robots: metadataState.robots }),
  });
}

export default async function AllPostsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  try {
    const { page = '1' } = await searchParams;

    // 페이지 값 유효성 검증
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);

    // 모든 게시판의 게시글 + 전체 공지 병렬 가져오기
    const [postsData, globalNotices] = await Promise.all([
      fetchPosts({
        limit: 20,
        page: currentPage
      }),
      getNotices(),  // 전체 공지 (포맷팅된 데이터)
    ]);

    // fetchPosts 결과를 직접 사용 (content 포함)
    const layoutPosts = postsData.data || [];

    const { topBoards, childBoardsMap: hoverChildBoardsMap } = await getGlobalHoverMenuData();

    // 가상의 "전체글" 게시판 데이터
    const allBoardData = {
      id: 'all',
      name: '전체글',
      slug: 'all',
      description: '모든 게시판의 게시글을 한곳에서 확인할 수 있습니다.',
      parent_id: null,
      team_id: null,
      league_id: null,
      display_order: 0,
      views: 0,
      access_level: null,
      logo: null
    };

    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <BoardDetailLayout
        boardData={allBoardData}
        breadcrumbs={[]}
        teamData={null}
        leagueData={null}
        isLoggedIn={false}
        canWrite={false}
        currentPage={currentPage}
        slug="all"
        rootBoardId="all"
        rootBoardSlug="all"
        posts={layoutPosts as unknown as Parameters<typeof BoardDetailLayout>[0]['posts']}
        topBoards={topBoards}
        hoverChildBoardsMap={hoverChildBoardsMap}
        notices={globalNotices}
        pagination={{
          totalItems: postsData.meta.totalItems,
          itemsPerPage: postsData.meta.itemsPerPage,
          currentPage: postsData.meta.currentPage
        }}
        listVariant="card"
      />
    );
  } catch (error) {
    console.error("AllPostsPage Error:", error);
    return (
      <div className="container mx-auto">
        <div className={errorBoxStyles}>
          <h1 className={errorTitleStyles}>오류가 발생했습니다</h1>
          <p className={errorMessageStyles}>전체 게시글을 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/" className={errorLinkStyles} prefetch={false}>메인페이지로 이동</Link>
        </div>
      </div>
    );
  }
}

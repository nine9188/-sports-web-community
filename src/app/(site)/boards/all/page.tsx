import Link from 'next/link';
import { fetchPosts } from '@/domains/boards/actions';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getNotices } from '@/domains/boards/actions/posts/notices';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { errorBoxStyles, errorTitleStyles, errorMessageStyles, errorLinkStyles } from '@/shared/styles';
import { buildMetadata } from '@/shared/utils/metadataNew';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  return buildMetadata({
    title: '전체글 - 해외축구·국내축구 게시판',
    description: '해외축구, 국내축구, 축구 분석, 자유게시판 등 모든 게시판의 최신 글을 한곳에서 확인하세요. 축구 커뮤니티 4590 Football.',
    path: '/boards/all',
    keywords: ['해외축구 게시판', '국내축구 게시판', '축구 분석 커뮤니티', '축구 커뮤니티', '해외축구', '국내축구'],
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

    // HoverMenu용 데이터 가져오기
    const supabase = await getSupabaseServer();
    const { data: boardsData } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true });

    // HoverMenu용 데이터 구조화
    const topBoards: Array<{
      id: string;
      name: string;
      display_order: number;
      slug?: string;
    }> = [];

    const hoverChildBoardsMap: Record<string, Array<{
      id: string;
      name: string;
      display_order: number;
      slug?: string;
    }>> = {};

    if (boardsData) {
      // 최상위 게시판들 (parent_id가 null)
      const rootBoards = boardsData.filter(board => !board.parent_id);

      topBoards.push(...rootBoards.map(board => ({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug || undefined
      })));

      // 모든 하위 게시판 관계 맵핑
      boardsData.forEach(board => {
        if (board.parent_id) {
          if (!hoverChildBoardsMap[board.parent_id]) {
            hoverChildBoardsMap[board.parent_id] = [];
          }
          hoverChildBoardsMap[board.parent_id].push({
            id: board.id,
            name: board.name,
            display_order: board.display_order || 0,
            slug: board.slug || undefined
          });
        }
      });
    }

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
        currentPage={currentPage}
        slug="all"
        rootBoardId="all"
        rootBoardSlug="all"
        posts={layoutPosts}
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
          <h2 className={errorTitleStyles}>오류가 발생했습니다</h2>
          <p className={errorMessageStyles}>전체 게시글을 불러오는 중 오류가 발생했습니다.</p>
          <Link href="/" className={errorLinkStyles}>메인페이지로 이동</Link>
        </div>
      </div>
    );
  }
}

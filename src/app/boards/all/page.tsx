import { fetchPosts } from '@/domains/boards/actions';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';
import ErrorMessage from '@/shared/ui/error-message';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AllPostsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  try {
    const { page = '1' } = await searchParams;

    // 페이지 값 유효성 검증
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);

    // 모든 게시판의 게시글 가져오기
    const postsData = await fetchPosts({
      limit: 20,
      page: currentPage
      // boardIds를 지정하지 않으면 모든 게시판에서 가져옴
    });

    // API 데이터를 레이아웃 호환 형식으로 변환
    const layoutPosts = convertApiPostsToLayoutPosts(postsData.data || []);

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
        pagination={{
          totalItems: postsData.meta.totalItems,
          itemsPerPage: postsData.meta.itemsPerPage,
          currentPage: postsData.meta.currentPage
        }}
        popularPosts={{ todayPosts: [], weekPosts: [] }}
        listVariant="card"
      />
    );
  } catch (error) {
    console.error("AllPostsPage Error:", error);
    return (
      <ErrorMessage message="전체 게시글을 불러오는 중 오류가 발생했습니다." />
    );
  }
}

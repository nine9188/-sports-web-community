import { getAllPopularPosts } from '@/domains/boards/actions/getAllPopularPosts';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import PopularPageClient from './PopularPageClient';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';
import ErrorMessage from '@/shared/ui/error-message';
import { generatePageMetadataWithDefaults } from '@/shared/utils/metadataNew';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  return generatePageMetadataWithDefaults('/boards/popular', {
    title: '인기글 - 4590 Football',
    description: '가장 인기 있는 게시글을 확인하세요. 좋아요가 많은 순서로 정렬됩니다.',
  });
}

export default async function PopularPostsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; period?: string }>
}) {
  try {
    const { page = '1', period = 'week' } = await searchParams;

    // 페이지 값 유효성 검증
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);

    // 기간 유효성 검증
    const validPeriods = ['today', 'week', 'month', 'all'];
    const validPeriod = validPeriods.includes(period) ? period as 'today' | 'week' | 'month' | 'all' : 'week';

    // 인기 게시글 가져오기
    const postsData = await getAllPopularPosts({
      period: validPeriod,
      page: currentPage,
      limit: 20
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

    // 기간별 설명
    const periodNames = {
      today: '오늘',
      week: '이번 주',
      month: '이번 달',
      all: '전체'
    };

    // 가상의 "인기글" 게시판 데이터
    const popularBoardData = {
      id: 'popular',
      name: `인기글 (${periodNames[validPeriod]})`,
      slug: 'popular',
      description: `${periodNames[validPeriod]} 인기 게시글을 확인할 수 있습니다. 좋아요가 많은 순서로 정렬됩니다.`,
      parent_id: null,
      team_id: null,
      league_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_order: 0,
      views: 0,
      access_level: 'public' as const,
      logo: null
    };

    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <PopularPageClient
        boardData={popularBoardData}
        breadcrumbs={[]}
        currentPage={currentPage}
        posts={layoutPosts}
        topBoards={topBoards}
        hoverChildBoardsMap={hoverChildBoardsMap}
        pagination={{
          totalItems: postsData.meta.totalItems,
          itemsPerPage: postsData.meta.itemsPerPage,
          currentPage: postsData.meta.currentPage
        }}
        period={validPeriod}
      />
    );
  } catch (error) {
    console.error("PopularPostsPage Error:", error);
    return (
      <ErrorMessage message="인기 게시글을 불러오는 중 오류가 발생했습니다." />
    );
  }
}

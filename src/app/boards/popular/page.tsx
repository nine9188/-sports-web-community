import { getAllPopularPosts } from '@/domains/boards/actions/getAllPopularPosts';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import PopularPageClient from './PopularPageClient';
import ErrorMessage from '@/shared/ui/error-message';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Post 타입 정의
interface LayoutPost {
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

// API Post를 레이아웃 호환 Post로 변환하는 함수
function convertApiPostsToLayoutPosts(apiPosts: any[]): LayoutPost[] {
  return apiPosts.map(post => ({
    id: post.id,
    title: post.title,
    board_id: post.board_id,
    board_name: post.board_name,
    board_slug: post.board_slug,
    post_number: post.post_number,
    created_at: post.created_at,
    formattedDate: post.formattedDate,
    views: post.views || 0,
    likes: post.likes || 0,
    author_nickname: post.author_nickname || '익명',
    author_id: post.author_id,
    author_icon_id: post.author_icon_id,
    author_icon_url: post.author_icon_url,
    author_level: post.author_level || 1,
    comment_count: post.comment_count || 0,
    content: post.content,
    team_id: typeof post.team_id === 'string' ? parseInt(post.team_id, 10) : post.team_id as number | null,
    team_logo: post.team_logo,
    league_id: typeof post.league_id === 'string' ? parseInt(post.league_id, 10) : post.league_id as number | null,
    league_logo: post.league_logo
  }));
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
      views: 0
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

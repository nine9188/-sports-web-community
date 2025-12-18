import { fetchPosts } from '@/domains/boards/actions';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
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

// API Post 타입 정의
interface ApiPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views?: number;
  likes?: number;
  author_nickname?: string;
  author_id?: string;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count?: number;
  content?: string;
  team_id?: number | string | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: number | string | null;
  league_name?: string | null;
  league_logo?: string | null;
}

// API Post를 레이아웃 호환 Post로 변환하는 함수
function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] {
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

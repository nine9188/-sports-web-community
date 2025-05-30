import { getBoardPageData } from '@/domains/boards/actions';
import { fetchPosts, Post as ApiPost } from '@/domains/boards/actions';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import ErrorMessage from '@/shared/ui/error-message';
import { createClient } from '@/shared/api/supabaseServer';

// BoardDetailLayout에서 사용하는 Post 타입 정의
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

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BoardDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string }>
}) {
  try {
    // 파라미터 및 쿼리 매개변수 추출
    const { slug } = await params;
    const { page = '1', from: fromParam } = await searchParams;
    
    // 페이지 값이 유효하지 않으면 기본값 1로 설정
    const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1 ? 1 : parseInt(page, 10);
    
    // 서버 액션을 통해 모든 데이터 로드
    const result = await getBoardPageData(slug, currentPage, fromParam);
    
    if (!result.success) {
      return (
        <ErrorMessage message={result.error || '게시판 정보를 불러오는 중 오류가 발생했습니다.'} />
      );
    }
    
    if (!result.boardData) {
      return (
        <ErrorMessage 
          title="게시판을 찾을 수 없습니다" 
          message={`요청하신 '${slug}' 게시판이 존재하지 않습니다.`} 
        />
      );
    }
    
    // 게시글 데이터 로드 (서버에서 미리 가져옴)
    const postsData = await fetchPosts({
      boardIds: result.filteredBoardIds,
      currentBoardId: result.boardData.id,
      page: currentPage,
      limit: 20,
      fromParam
    });
    
    // API 데이터를 레이아웃 호환 형식으로 변환
    const layoutPosts = convertApiPostsToLayoutPosts(postsData.data || []);
    
    // HoverMenu용 데이터 가져오기
    const supabase = await createClient();
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
      // 루트 게시판 찾기 (현재 게시판의 최상위)
      const rootBoardId = result.rootBoardId || '';
      
      // 루트 게시판의 직접 하위 게시판들 (상위 게시판들)
      const rootChildBoards = boardsData.filter(board => 
        board.parent_id === rootBoardId
      );
      
      // HoverMenu용 상위 게시판 데이터 구조화
      topBoards.push(...rootChildBoards.map(board => ({
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
    
    // 레이아웃 컴포넌트에 데이터 전달
    return (
      <BoardDetailLayout
        boardData={{
          ...result.boardData,
          slug: result.boardData.slug || ''
        }}
        breadcrumbs={result.breadcrumbs || []}
        teamData={result.teamData || null}
        leagueData={result.leagueData ? {
          ...result.leagueData,
          type: 'league'
        } : null}
        isLoggedIn={result.isLoggedIn || false}
        currentPage={currentPage}
        slug={slug}
        fromParam={fromParam}
        childBoardsMap={result.childBoardsMap || {}}
        rootBoardId={result.rootBoardId || ''}
        rootBoardSlug={result.rootBoardSlug || undefined}
        // 서버에서 미리 가져온 데이터 전달
        posts={layoutPosts}
        topBoards={topBoards}
        hoverChildBoardsMap={hoverChildBoardsMap}
      />
    );
  } catch (error) {
    console.error("BoardDetailPage Error:", error);
    return (
      <ErrorMessage message="게시판 정보를 불러오는 중 오류가 발생했습니다." />
    );
  }
} 
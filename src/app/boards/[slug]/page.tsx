import { getBoardPageData } from '@/domains/boards/actions';
import { fetchPosts } from '@/domains/boards/actions';
import { getBoardPopularPosts } from '@/domains/boards/actions/getPopularPosts';
import { getNotices } from '@/domains/boards/actions/posts';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';
import ErrorMessage from '@/shared/ui/error-message';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

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

    // 인기 게시글 데이터 가져오기
    const popularPosts = await getBoardPopularPosts(result.boardData.id);

    // 공지사항 데이터 가져오기
    const isNoticeBoard = result.boardData.slug === 'notice' || result.boardData.slug === 'notices';

    let finalPosts;
    let finalNotices;
    let finalPagination;

    if (isNoticeBoard) {
      // 공지사항 게시판: 헤더는 공지사항 게시판 공지만, PostList는 모든 공지
      const allNotices = await getNotices(); // PostList용 - 모든 공지 (필독 + 전체 + 게시판)
      const headerNotices = await getNotices(result.boardData.id); // 헤더용 - 전체 공지 + 공지사항 게시판 공지

      finalPosts = allNotices as any;
      finalNotices = headerNotices;

      // 공지사항 게시판은 페이지네이션 없이 모든 공지 표시
      finalPagination = {
        totalItems: allNotices.length,
        itemsPerPage: allNotices.length,
        currentPage: 1
      };
    } else {
      // 일반 게시판: 전체 공지 + 현재 게시판 공지
      const notices = await getNotices(result.boardData.id);
      finalPosts = layoutPosts;
      finalNotices = notices;
      finalPagination = {
        totalItems: postsData.meta.totalItems,
        itemsPerPage: postsData.meta.itemsPerPage,
        currentPage: postsData.meta.currentPage
      };
    }

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
        rootBoardId={result.rootBoardId || ''}
        rootBoardSlug={result.rootBoardSlug || undefined}
        // 서버에서 미리 가져온 데이터 전달
        posts={finalPosts}
        topBoards={topBoards}
        hoverChildBoardsMap={hoverChildBoardsMap}
        pagination={finalPagination}
        popularPosts={popularPosts}
        notices={finalNotices}
      />
    );
  } catch (error) {
    console.error("BoardDetailPage Error:", error);
    return (
      <ErrorMessage message="게시판 정보를 불러오는 중 오류가 발생했습니다." />
    );
  }
} 
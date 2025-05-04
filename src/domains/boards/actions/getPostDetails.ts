'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { AdjacentPosts } from '../types/post';
import { getBoardLevel, getFilteredBoardIds, findRootBoard, createBreadcrumbs } from '../utils/board/boardHierarchy';
import { formatPosts } from '../utils/post/postUtils';
import { BoardMap, ChildBoardsMap, BoardData } from '../types/board';

/**
 * 게시글 상세 페이지에 필요한 모든 데이터를 가져옵니다.
 */
export async function getPostPageData(slug: string, postNumber: string, fromBoardId?: string) {
  try {
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      throw new Error('유효하지 않은 게시글 번호입니다.');
    }
    
    const supabase = await createClient();
    
    // 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    
    // 1. 게시판 정보 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (boardError || !board) {
      throw new Error('게시판을 찾을 수 없습니다.');
    }
    
    // 2. 게시글 상세 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*, profiles(id, nickname, icon_id, level), board:board_id(name)')
      .eq('board_id', board.id)
      .eq('post_number', postNum)
      .single();
      
    if (postError || !post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // 3. 게시판 구조 데이터 가져오기
    const { data: boardStructure } = await supabase
      .from('boards')
      .select('*')
      .order('display_order');
    
    // 4. 이전/다음 게시글 가져오기
    const { data: prevPostData } = await supabase
      .from('posts')
      .select('id, title, post_number')
      .eq('board_id', board.id)
      .lt('post_number', postNum)
      .order('post_number', { ascending: false })
      .limit(1)
      .single();
    
    const { data: nextPostData } = await supabase
      .from('posts')
      .select('id, title, post_number')
      .eq('board_id', board.id)
      .gt('post_number', postNum)
      .order('post_number', { ascending: true })
      .limit(1)
      .single();
    
    // 이전/다음 게시글 구성
    const adjacentPosts: AdjacentPosts = {
      prevPost: prevPostData || null,
      nextPost: nextPostData || null
    };
    
    // 5. 댓글 가져오기
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, profiles(nickname, icon_id)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    const comments = commentsData || [];
    
    // 6. 게시판 맵 및 자식 게시판 맵 구성
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: Record<string, string> = {};
    
    // Board 인터페이스와 완전히 호환되는 인터페이스 정의
    interface BoardStructure {
      id: string;
      name: string;
      slug: string;
      parent_id: string | null;
      team_id: number | null;
      league_id: number | null;
      display_order: number | null;
      description: string | null;
      access_level: string | null;
      logo: string | null;
      views: number | null;
    }
    
    (boardStructure || []).forEach((board: BoardStructure) => {
      boardsMap[board.id] = board;
      boardNameMap[board.id] = board.name;
      
      if (board.parent_id) {
        if (!childBoardsMap[board.parent_id]) {
          childBoardsMap[board.parent_id] = [];
        }
        childBoardsMap[board.parent_id].push(board);
      }
    });
    
    // 7. 루트 게시판 ID 찾기
    const rootBoardId = findRootBoard(board.id, boardsMap);
    
    // 8. 게시판 레벨 확인
    const boardLevel = getBoardLevel(board.id, boardsMap, childBoardsMap);
    
    // 9. 최상위 게시판의 직계 하위 게시판들
    const topLevelBoards = (boardStructure || [])
      .filter((b: BoardStructure) => b.parent_id === rootBoardId)
      .sort((a: BoardStructure, b: BoardStructure) => 
        ((a.display_order || 0) - (b.display_order || 0)));
    
    // 10. 하위 게시판 ID 찾기
    const allSubBoardIds: string[] = [];
    (boardStructure || []).forEach((b: BoardStructure) => {
      if (b.parent_id === rootBoardId) {
        allSubBoardIds.push(b.id);
        
        (boardStructure || []).forEach((subBoard: BoardStructure) => {
          if (subBoard.parent_id === b.id) {
            allSubBoardIds.push(subBoard.id);
          }
        });
      }
    });
    
    // fromParam 처리
    let normalizedFromBoardId = fromBoardId;
    if (normalizedFromBoardId === 'boards' || normalizedFromBoardId === 'root') {
      normalizedFromBoardId = rootBoardId;
    }
    
    // 11. 필터링할 게시판 ID 목록 가져오기
    const filteredBoardIds = getFilteredBoardIds(
      board.id,
      boardLevel,
      boardsMap,
      childBoardsMap
    );
    
    // 12. 현재 페이지 게시글 가져오기 (첫 페이지만)
    const pageSize = 20;
    const page = 1;
    
    // 필터링 조건 설정
    let boardFilter;
    if (normalizedFromBoardId && boardsMap[normalizedFromBoardId]) {
      const fromBoardLevel = getBoardLevel(normalizedFromBoardId, boardsMap, childBoardsMap);
      boardFilter = getFilteredBoardIds(normalizedFromBoardId, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      boardFilter = filteredBoardIds;
    }
    
    // 게시글 가져오기
    const { data: postsData, count } = await supabase
      .from('posts')
      .select('*, profiles(id, nickname, icon_id, level)', { count: 'exact' })
      .in('board_id', boardFilter)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    // 13. 댓글 수 가져오기
    const postIds = (postsData || []).map(p => p.id);
    const { data: commentCountsData } = await supabase
      .from('comments')
      .select('post_id, count')
      .in('post_id', postIds);
    
    const commentCounts: Record<string, number> = {};
    interface CommentCount {
      post_id: string;
      count: string | number;
    }
    
    (commentCountsData || []).forEach((item: CommentCount) => {
      commentCounts[item.post_id] = typeof item.count === 'string' ? parseInt(item.count, 10) : item.count;
    });
    
    // 14. 게시판 데이터 맵 구성
    const boardsData: Record<string, BoardData> = {};
    (boardStructure || []).forEach((board: BoardStructure) => {
      boardsData[board.id] = {
        team_id: board.team_id || null,
        league_id: board.league_id || null,
        slug: board.slug || board.id
      };
    });
    
    // 15. 팀 및 리그 정보 가져오기
    const teamIds = Object.values(boardsData)
      .map(bd => bd.team_id)
      .filter(id => id !== null) as number[];
    
    const leagueIds = Object.values(boardsData)
      .map(bd => bd.league_id)
      .filter(id => id !== null) as number[];
    
    const teamPromise = teamIds.length > 0
      ? supabase.from('teams').select('*').in('id', teamIds)
      : Promise.resolve({ data: [] });

    const leaguePromise = leagueIds.length > 0
      ? supabase.from('leagues').select('*').in('id', leagueIds)
      : Promise.resolve({ data: [] });

    const [teamsResult, leaguesResult] = await Promise.all([
      teamPromise,
      leaguePromise
    ]);
    
    // 팀 및 리그 맵 구성
    interface TeamData {
      id: number;
      name: string;
      logo: string; // TeamInfo와 호환되도록 필수 필드 추가
      [key: string]: unknown;
    }
    
    interface LeagueData {
      id: number;
      name: string;
      logo: string; // LeagueInfo와 호환되도록 필수 필드 추가
      [key: string]: unknown;
    }
    
    const teamsMap: Record<string, TeamData> = {};
    (teamsResult.data || []).forEach((team: TeamData) => {
      teamsMap[team.id] = team;
    });
    
    const leaguesMap: Record<string, LeagueData> = {};
    (leaguesResult.data || []).forEach((league: LeagueData) => {
      leaguesMap[league.id] = league;
    });
    
    // 16. 게시글 데이터 포맷팅
    const formattedPosts = formatPosts(
      postsData || [],
      commentCounts,
      boardsData,
      boardNameMap,
      teamsMap,
      leaguesMap
    );
    
    // 17. 작성자 아이콘 URL 가져오기
    const iconId = post.profiles?.icon_id;
    let iconUrl = null;
    
    if (iconId) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', iconId)
        .single();
      
      iconUrl = iconData?.image_url || null;
    }
    
    // 18. 브레드크럼 생성
    const breadcrumbs = createBreadcrumbs(board, post.title, postNumber);
    
    // 19. 조회수 증가 (비동기 처리 - 에러 무시)
    try {
      await supabase.rpc('increment_view_count', { post_id: post.id });
    } catch (error) {
      // 실패해도 무시
      console.error('조회수 증가 실패:', error);
    }
    
    // 20. 게시글 파일 첨부 정보 가져오기
    const { data: filesData } = await supabase
      .from('post_files')
      .select('url, filename')
      .eq('post_id', post.id);
    
    // 결과 반환
    return {
      success: true,
      post: {
        ...post,
        files: filesData || []
      },
      board,
      breadcrumbs,
      comments,
      isLoggedIn,
      isAuthor: user?.id === post.user_id,
      adjacentPosts,
      formattedPosts,
      topLevelBoards: topLevelBoards.map((board: BoardStructure) => ({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug
      })),
      childBoardsMap,
      rootBoardId,
      rootBoardSlug: boardsData[rootBoardId]?.slug,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      normalizedFromBoardId,
      iconUrl
    };
  } catch (error) {
    console.error('게시글 데이터 로딩 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 데이터를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글 조회수 증가
 */
export async function incrementViewCount(postId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc('increment_view_count', { post_id: postId });
  } catch (error) {
    console.error('조회수 증가 오류:', error);
  }
}

/**
 * 댓글 목록 가져오기
 */
export async function getComments(postId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(nickname, icon_id)')
      .eq('post_id', postId)
      .order('created_at');
      
    if (error) throw error;
    
    return {
      success: true,
      comments: data
    };
  } catch (error) {
    console.error('댓글 가져오기 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글을 불러오는 중 오류가 발생했습니다.'
    };
  }
} 
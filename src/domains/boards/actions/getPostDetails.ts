'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { AdjacentPosts } from '../types/post';
import { getBoardLevel, getFilteredBoardIds, findRootBoard, createBreadcrumbs } from '../utils/board/boardHierarchy';
import { formatPosts } from '../utils/post/postUtils';
import { BoardMap, ChildBoardsMap, BoardData } from '../types/board';
import { getComments } from './comments/index';

/**
 * 게시글 상세 페이지에 필요한 모든 데이터를 가져옵니다.
 */
export async function getPostPageData(slug: string, postNumber: string, fromBoardId?: string, pageParam?: number) {
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
    
    // 2. 병렬로 데이터 가져오기 - 성능 최적화
    const [
      postResult,
      boardStructureResult,
      prevPostResult,
      nextPostResult
    ] = await Promise.all([
      // 게시글 상세 정보
      supabase
        .from('posts')
        .select('*, profiles(id, nickname, icon_id, level), board:board_id(name)')
        .eq('board_id', board.id)
        .eq('post_number', postNum)
        .single(),
      
      // 게시판 구조 데이터
      supabase
        .from('boards')
        .select('*')
        .order('display_order'),
      
      // 이전 게시글
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', board.id)
        .lt('post_number', postNum)
        .order('post_number', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      // 다음 게시글
      supabase
        .from('posts')
        .select('id, title, post_number')
        .eq('board_id', board.id)
        .gt('post_number', postNum)
        .order('post_number', { ascending: true })
        .limit(1)
        .maybeSingle()
    ]);
    
    const { data: post, error: postError } = postResult;
    if (postError || !post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }


    
    const { data: boardStructure } = boardStructureResult;
    const { data: prevPostData } = prevPostResult;
    const { data: nextPostData } = nextPostResult;
    
    // 이전/다음 게시글 구성
    const adjacentPosts: AdjacentPosts = {
      prevPost: prevPostData || null,
      nextPost: nextPostData || null
    };
    
    // 3. 게시판 맵 및 자식 게시판 맵 구성 - 메모이제이션
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: Record<string, string> = {};
    const boardsData: Record<string, BoardData> = {};
    
    (boardStructure || []).forEach((board) => {
      const safeBoard = {
        ...board,
        slug: board.slug || board.id,
        display_order: board.display_order || 0
      };
      boardsMap[board.id] = safeBoard;
      boardNameMap[board.id] = board.name;
      boardsData[board.id] = {
        team_id: board.team_id || null,
        league_id: board.league_id || null,
        slug: board.slug || board.id
      };
      
      if (board.parent_id) {
        if (!childBoardsMap[board.parent_id]) {
          childBoardsMap[board.parent_id] = [];
        }
        childBoardsMap[board.parent_id].push(safeBoard);
      }
    });
    
    // 4. 루트 게시판 ID 및 레벨 계산
    const rootBoardId = findRootBoard(board.id, boardsMap);
    const boardLevel = getBoardLevel(board.id, boardsMap, childBoardsMap);
    
    // 5. 최상위 게시판의 직계 하위 게시판들
    const topLevelBoards = (boardStructure || [])
      .filter((b) => b.parent_id === rootBoardId)
      .sort((a, b) => ((a.display_order || 0) - (b.display_order || 0)));
    
    // fromParam 처리
    let normalizedFromBoardId = fromBoardId;
    if (normalizedFromBoardId === 'boards' || normalizedFromBoardId === 'root') {
      normalizedFromBoardId = rootBoardId;
    }
    
    // 6. 필터링할 게시판 ID 목록 가져오기
    const filteredBoardIds = getFilteredBoardIds(
      board.id,
      boardLevel,
      boardsMap,
      childBoardsMap
    );
    
    // 7. 현재 페이지 게시글 가져오기 - 전달된 페이지 사용
    const pageSize = 20;
    const page = typeof pageParam === 'number' && Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    
    // 필터링 조건 설정
    let boardFilter;
    if (normalizedFromBoardId && boardsMap[normalizedFromBoardId]) {
      const fromBoardLevel = getBoardLevel(normalizedFromBoardId, boardsMap, childBoardsMap);
      boardFilter = getFilteredBoardIds(normalizedFromBoardId, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      boardFilter = filteredBoardIds;
    }
    
    // 8. 병렬로 추가 데이터 가져오기
    const [
      postsResult,
      commentsResult,
      filesResult,
      postUserActionResult
    ] = await Promise.all([
      // 게시글 목록
      supabase
        .from('posts')
        .select('*, profiles(id, nickname, icon_id, level)', { count: 'exact' })
        .in('board_id', boardFilter)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1),
      
      // 댓글 목록 - 사용자 액션 정보 포함
      getComments(post.id),
      
      // 첨부 파일
      supabase
        .from('post_files')
        .select('url, filename')
        .eq('post_id', post.id),
      
      // 게시글 사용자 액션 정보 (로그인한 경우에만)
      user ? supabase
        .from('post_likes')
        .select('type')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle() : Promise.resolve({ data: null })
    ]);
    
    const { data: postsData, count } = postsResult;
    const filesData = filesResult.data;
    const postUserActionData = postUserActionResult.data;
    
    // 게시글 사용자 액션 처리
    const postUserAction: 'like' | 'dislike' | null = postUserActionData?.type === 'like' ? 'like' :
                                                       postUserActionData?.type === 'dislike' ? 'dislike' :
                                                       null;
    
    // 댓글 데이터 처리
    const comments = commentsResult.success ? (commentsResult.comments || []) : [];
    
    // 댓글 데이터에 userAction 필드가 포함되도록 명시적으로 매핑
    const processedComments = comments.map(comment => {
      // userAction을 명시적으로 문자열로 변환하여 직렬화 보장
      const userAction = comment.userAction;
      const serializedUserAction = userAction === 'like' ? 'like' : 
                                   userAction === 'dislike' ? 'dislike' : 
                                   null;
      
      return {
        id: comment.id,
        user_id: comment.user_id,
        post_id: comment.post_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        parent_id: comment.parent_id,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        userAction: serializedUserAction, // 명시적으로 직렬화된 값 사용
        profiles: comment.profiles
      };
    });
    
    // JSON 직렬화를 통해 데이터 무결성 보장
    const serializedComments = JSON.parse(JSON.stringify(processedComments));
    
    // 9. 댓글 수 가져오기 - 최적화
    const postIds = (postsData || []).map(p => p.id);
    const commentCounts: Record<string, number> = {};
    
    if (postIds.length > 0) {
      const { data: commentCountsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false);
      
      (commentCountsData || []).forEach((comment) => {
        if (comment.post_id) {
          commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
        }
      });
    }
    
    // 10. 팀 및 리그 정보 가져오기 - 필요한 경우에만
    const teamIds = Object.values(boardsData)
      .map(bd => bd.team_id)
      .filter(id => id !== null) as number[];
    
    const leagueIds = Object.values(boardsData)
      .map(bd => bd.league_id)
      .filter(id => id !== null) as number[];
    
    const teamsMap: Record<string, { id: number; name: string; logo: string; [key: string]: unknown }> = {};
    const leaguesMap: Record<string, { id: number; name: string; logo: string; [key: string]: unknown }> = {};
    
    if (teamIds.length > 0 || leagueIds.length > 0) {
      const [teamsResult, leaguesResult] = await Promise.all([
        teamIds.length > 0
          ? supabase.from('teams').select('*').in('id', teamIds)
          : Promise.resolve({ data: [] }),
        leagueIds.length > 0
          ? supabase.from('leagues').select('*').in('id', leagueIds)
          : Promise.resolve({ data: [] })
      ]);
      
      // 팀 및 리그 맵 구성
      (teamsResult.data || []).forEach((team) => {
        teamsMap[team.id] = { ...team, logo: team.logo || '' };
      });
      
      (leaguesResult.data || []).forEach((league) => {
        leaguesMap[league.id] = { ...league, logo: league.logo || '' };
      });
    }
    
    // 11. 게시글 데이터 포맷팅
    const formattedPosts = await formatPosts(
      (postsData || []).map(post => ({
        ...post,
        is_hidden: post.is_hidden ?? undefined,
        is_deleted: post.is_deleted ?? undefined,
        profiles: post.profiles ? {
          ...post.profiles,
          level: post.profiles.level || undefined
        } : undefined
      })),
      commentCounts,
      boardsData,
      boardNameMap,
      teamsMap,
      leaguesMap
    );
    
    // 12. 작성자 아이콘 URL 가져오기 - 필요한 경우에만
    let iconUrl = null;
    const iconId = post.profiles?.icon_id;
    
    if (iconId) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', iconId)
        .single();
      
      iconUrl = iconData?.image_url || null;
    }
    
    // 13. 브레드크럼 생성
    const safeBoardForBreadcrumb = {
      ...board,
      slug: board.slug || board.id
    };
    const breadcrumbs = createBreadcrumbs(safeBoardForBreadcrumb, post.title, postNumber, boardsMap);
    
    // 14. 조회수 증가 (비동기 처리 - 에러 무시)
    try {
      await supabase.rpc('increment_view_count', { post_id: post.id });
    } catch {
      // 실패해도 무시
    }
    
    // 15. 하위 게시판 ID 찾기
    const allSubBoardIds: string[] = [];
    (boardStructure || []).forEach((b) => {
      if (b.parent_id === rootBoardId) {
        allSubBoardIds.push(b.id);
        
        (boardStructure || []).forEach((subBoard) => {
          if (subBoard.parent_id === b.id) {
            allSubBoardIds.push(subBoard.id);
          }
        });
      }
    });
    
    // 결과 반환
    return {
      success: true,
      post: {
        ...post,
        files: filesData || []
      },
      board,
      breadcrumbs,
      comments: serializedComments,
      isLoggedIn,
      isAuthor: user?.id === post.user_id,
      currentUserId: user?.id || null,
      adjacentPosts,
      formattedPosts,
      topLevelBoards: topLevelBoards.map((board) => ({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug || board.id
      })),
      childBoardsMap,
      rootBoardId,
      rootBoardSlug: boardsData[rootBoardId]?.slug,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      normalizedFromBoardId,
      iconUrl,
      postUserAction,
      allSubBoardIds
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
 * 게시글 상세 조회
 */
export async function getPost(postId: string) {
  try {
    const supabase = await createClient()
    
    // 게시글 조회 및 조회수 증가
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, 
        title, 
        content, 
        created_at, 
        updated_at,
        user_id, 
        board_id,
        view_count, 
        like_count,
        profiles(id, username, avatar_url, full_name),
        boards(id, name, slug)
      `)
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('게시글 조회 오류:', error)
      throw new Error('게시글 조회 실패')
    }
    
    // 조회수 증가 (별도 쿼리)
    await supabase.rpc('increment_view_count', { post_id: postId })
    
    return data
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return null
  }
} 
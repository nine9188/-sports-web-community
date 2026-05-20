'use server';

import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { AdjacentPosts } from '../types/post';
import { getBoardLevel, getFilteredBoardIds, findRootBoard, createBreadcrumbs } from '../utils/board/boardHierarchy';
import { formatPosts } from '../utils/post/postUtils';
import { processContentToHtml } from '../utils/post/processContentToHtml';
import { Board, BoardMap, ChildBoardsMap, BoardData } from '../types/board';
import { getComments } from './comments/index';
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';
import { getCachedAllBoards, getCachedBoardBySlug } from './getCachedBoards';
import { getCachedTeamsByIds, getCachedLeaguesByIds } from './getCachedTeamsLeagues';
import { getCachedShopItemIconUrl } from './getCachedShopItems';
import type { PostPoll } from '../types/poll';
import { oneOrNull } from '@/shared/utils/supabaseRelations';

const POST_DETAIL_LIST_PAGE_SIZE = 20;
const POLL_VISITOR_COOKIE = 'post_poll_visitor_id';

type BoardStructureRow = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  display_order: number | null;
  view_type: string | null;
  team_id: number | null;
  league_id: number | null;
};

/**
 * 게시글 상세 페이지에 필요한 모든 데이터를 가져옵니다.
 */
export async function getPostPageData(slug: string, postNumber: string, fromBoardId?: string, pageParam?: number) {
  try {
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      throw new Error('유효하지 않은 게시글 번호입니다.');
    }
    
    const supabase = await getSupabaseServer();
    
    // 로그인 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    
    // 1. 게시판 정보 가져오기 (캐시 활용 - 7일)
    const board = await getCachedBoardBySlug(slug);

    if (!board) {
      return {
        success: false,
        notFoundType: 'BOARD' as const,
        error: '게시판을 찾을 수 없습니다.'
      };
    }
    
    // 2. 병렬로 데이터 가져오기 - 성능 최적화
    // boardStructure는 unstable_cache 기반 getCachedAllBoards() 사용 (7일 캐시)
    const [
      postResult,
      cachedBoardStructure,
      prevPostResult,
      nextPostResult
    ] = await (async () => {
      const result = await Promise.all([
      // 게시글 상세 정보 — posts 메타만 조회 (content는 아래에서 별도 조회)
      supabase
        .from('posts')
        .select('id, title, user_id, views, likes, dislikes, tags, created_at, updated_at, board_id, post_number, source_url, meta, is_notice, notice_type, notice_order, notice_created_at, notice_boards, is_must_read, deal_info, show_in_widget, is_hidden, is_deleted, profiles(id, nickname, icon_id, level, exp, public_id), board:board_id(name)')
        .eq('board_id', board.id)
        .eq('post_number', postNum)
        .single(),

      // 게시판 구조 데이터 (캐시)
      getCachedAllBoards(),

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
      return result;
    })();
    
    const { data: postRaw, error: postError } = postResult;
    if (postError || !postRaw) {
      return {
        success: false,
        notFoundType: 'POST' as const,
        error: '게시글을 찾을 수 없습니다.'
      };
    }

    // posts_content 별도 쿼리로 content 가져오기 (PostgREST JOIN 안 씀 — 관계 추론 실패 방지)
    const { data: contentRow } = await supabase
      .from('posts_content')
      .select('content')
      .eq('post_id', postRaw.id)
      .maybeSingle();

    const post = {
      ...postRaw,
      content: contentRow?.content ?? null,
    } as typeof postRaw & { content: unknown };

    const cookieStore = await cookies();
    const pollVisitorId = cookieStore.get(POLL_VISITOR_COOKIE)?.value || null;
    const { data: pollData } = await (supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: PostPoll | null }>;
    }).rpc('get_post_poll_for_post', {
      p_post_id: post.id,
      p_visitor_id: pollVisitorId,
    });

    const boardStructure = (cachedBoardStructure ?? []) as BoardStructureRow[];
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
    
    boardStructure.forEach((board) => {
      const safeBoard = {
        ...board,
        slug: board.slug || board.id,
        display_order: board.display_order || 0,
        view_type: board.view_type as Board['view_type']
      };
      boardsMap[board.id] = safeBoard as Board;
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
        childBoardsMap[board.parent_id].push(safeBoard as Board);
      }
    });
    
    // 4. 루트 게시판 ID 및 레벨 계산
    const rootBoardId = findRootBoard(board.id, boardsMap);
    const boardLevel = getBoardLevel(board.id, boardsMap, childBoardsMap);
    
    // 5. 최상위 게시판의 직계 하위 게시판들
    const topLevelBoards = boardStructure
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
    const pageSize = POST_DETAIL_LIST_PAGE_SIZE;
    const requestedPage = typeof pageParam === 'number' && Number.isFinite(pageParam) && pageParam > 0
      ? Math.floor(pageParam)
      : null;
    let page = requestedPage || 1;
    
    // 필터링 조건 설정
    let boardFilter;
    if (normalizedFromBoardId && boardsMap[normalizedFromBoardId]) {
      const fromBoardLevel = getBoardLevel(normalizedFromBoardId, boardsMap, childBoardsMap);
      boardFilter = getFilteredBoardIds(normalizedFromBoardId, fromBoardLevel, boardsMap, childBoardsMap);
    } else {
      boardFilter = filteredBoardIds;
    }

    if (!requestedPage && post.created_at) {
      const { count: postsBeforeCurrent } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('board_id', boardFilter)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .gt('created_at', post.created_at);

      page = Math.floor((postsBeforeCurrent || 0) / pageSize) + 1;
    }
    
    // 8. 필요한 ID 미리 계산 (팀/리그용)
    const teamIds = Object.values(boardsData)
      .map(bd => bd.team_id)
      .filter((id): id is number => id !== null);

    const leagueIds = Object.values(boardsData)
      .map(bd => bd.league_id)
      .filter((id): id is number => id !== null);

    const iconId = oneOrNull(post.profiles)?.icon_id;

    // 9. 병렬로 모든 추가 데이터 가져오기 (Waterfall 제거)
    const [
      postsResult,
      commentsResult,
      filesResult,
      postUserActionResult,
      teamsResult,
      leaguesResult,
      iconResult
    ] = await (async () => {
      const result = await Promise.all([
      // 게시글 목록 — 모든 view_type에서 thumbnail_url + summary 사용
      // posts.content 컬럼 제거 후 thumbnail_url/summary로 egress 절감
      supabase
        .from('posts')
        .select(
          'id, title, post_number, views, likes, dislikes, created_at, updated_at, user_id, board_id, is_notice, is_must_read, notice_type, notice_boards, notice_order, notice_created_at, is_hidden, is_deleted, show_in_widget, meta, deal_info, thumbnail_url, summary, profiles(id, nickname, icon_id, level, exp, public_id)',
          { count: 'exact' }
        )
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
        .maybeSingle() : Promise.resolve({ data: null }),

      // 팀 정보 (캐시 7일) - 4590 표준: logo 제외, 별도 조회
      getCachedTeamsByIds(teamIds).then(data => ({ data })),

      // 리그 정보 (캐시 7일) - 4590 표준: logo 제외, 별도 조회
      getCachedLeaguesByIds(leagueIds).then(data => ({ data })),

      // 작성자 아이콘 (캐시 7일)
      getCachedShopItemIconUrl(iconId).then(url => ({ data: url ? { image_url: url } : null }))
      ]);
      return result;
    })();
    
    const { data: postsData, count } = postsResult;
    const filesData = filesResult.data;
    const postUserActionData = postUserActionResult.data;

    // 4590 표준: Storage URL로 팀/리그 로고 조회 (다크모드 포함)
    const [teamLogoUrlMap, leagueLogoUrlMap, leagueLogoDarkUrlMap] = await Promise.all([
      teamIds.length > 0 ? getTeamLogoUrls(teamIds) : Promise.resolve({} as Record<number, string>),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds) : Promise.resolve({} as Record<number, string>),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds, true) : Promise.resolve({} as Record<number, string>)  // 다크모드
    ]);

    // 게시글 사용자 액션 처리
    const postUserAction: 'like' | 'dislike' | null = postUserActionData?.type === 'like' ? 'like' :
                                                       postUserActionData?.type === 'dislike' ? 'dislike' :
                                                       null;

    // 댓글 데이터 처리
    const comments = commentsResult.success ? (commentsResult.comments || []) : [];

    // 댓글 데이터에 userAction 필드가 포함되도록 명시적으로 매핑
    const processedComments = comments.map(comment => {
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
        comment_number: comment.comment_number,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        userAction: serializedUserAction,
        profiles: comment.profiles
      };
    });

    // JSON 직렬화를 통해 데이터 무결성 보장
    const serializedComments = JSON.parse(JSON.stringify(processedComments));

    // 10. 팀/리그/아이콘 맵 구성 (4590 표준: Storage URL 사용)
    const teamsMap: Record<string, { id: number; name: string; logo: string; [key: string]: unknown }> = {};
    const leaguesMap: Record<string, { id: number; name: string; logo: string; logo_dark: string; [key: string]: unknown }> = {};

    ((teamsResult.data ?? []) as Array<{ id: number; name: string; [key: string]: unknown }>).forEach((team) => {
      teamsMap[team.id] = {
        ...team,
        logo: teamLogoUrlMap[team.id] || ''  // 4590 표준: Storage URL
      };
    });

    ((leaguesResult.data ?? []) as Array<{ id: number; name: string; [key: string]: unknown }>).forEach((league) => {
      leaguesMap[league.id] = {
        ...league,
        logo: leagueLogoUrlMap[league.id] || '',  // 4590 표준: Storage URL
        logo_dark: leagueLogoDarkUrlMap[league.id] || ''  // 다크모드 로고
      };
    });

    const iconUrl = iconResult.data?.image_url || null;

    // 11. 댓글 수 가져오기 - RPC로 최적화 (GROUP BY)
    const postIds = (postsData || []).map(p => p.id);
    const commentCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      // RPC가 없으면 기존 방식 사용하되, 한 번에 집계
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

    // 12. 게시글 데이터 포맷팅
    const formattedPosts = await formatPosts(
      (postsData || []).map(p => ({
        ...p,
        is_hidden: p.is_hidden ?? undefined,
        is_deleted: p.is_deleted ?? undefined,
        is_notice: p.is_notice ?? undefined,
        profiles: oneOrNull(p.profiles) ? {
          ...oneOrNull(p.profiles),
          level: oneOrNull(p.profiles)?.level || undefined
        } : undefined
      })) as unknown as import('../types/post').Post[],
      commentCounts,
      boardsData,
      boardNameMap,
      teamsMap,
      leaguesMap
    );
    
    // 13. 브레드크럼 생성
    const safeBoardForBreadcrumb = {
      ...board,
      slug: board.slug || board.id,
      view_type: board.view_type as Board['view_type']
    } as Board;
    const breadcrumbs = createBreadcrumbs(safeBoardForBreadcrumb, post.title, postNumber, boardsMap);

    // 14. 콘텐츠 HTML 변환 (서버 사이드 - 깜빡임 방지)
    const processedHtml = processContentToHtml(post.content as unknown as Parameters<typeof processContentToHtml>[0]);

    // 15. 조회수 증가 (fire-and-forget - 응답 대기 안함)
    supabase.rpc('increment_view_count', { post_id: post.id }).then(() => {});
    
    // 15. 하위 게시판 ID 찾기
    const allSubBoardIds: string[] = [];
    boardStructure.forEach((b) => {
      if (b.parent_id === rootBoardId) {
        allSubBoardIds.push(b.id);
        
        boardStructure.forEach((subBoard) => {
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
      poll: pollData || null,
      board,
      breadcrumbs,
      processedHtml,
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

export async function getPostDetailListPageData(
  slug: string,
  postNumber: string,
  pageParam: number,
  fromBoardId?: string
) {
  try {
    const postNum = parseInt(postNumber, 10);
    if (isNaN(postNum) || postNum <= 0) {
      return { success: false as const, error: '유효하지 않은 게시글 번호입니다.' };
    }

    const supabase = await getSupabaseServer();
    const board = await getCachedBoardBySlug(slug);
    if (!board) {
      return { success: false as const, error: '게시판을 찾을 수 없습니다.' };
    }

    const cachedBoardStructure = await getCachedAllBoards();

    const boardStructure = (cachedBoardStructure ?? []) as BoardStructureRow[];
    const boardsMap: BoardMap = {};
    const childBoardsMap: ChildBoardsMap = {};
    const boardNameMap: Record<string, string> = {};
    const boardsData: Record<string, BoardData> = {};

    boardStructure.forEach((board) => {
      const safeBoard = {
        ...board,
        slug: board.slug || board.id,
        display_order: board.display_order || 0,
        view_type: board.view_type as Board['view_type'],
      };
      boardsMap[board.id] = safeBoard as Board;
      boardNameMap[board.id] = board.name;
      boardsData[board.id] = {
        team_id: board.team_id || null,
        league_id: board.league_id || null,
        slug: board.slug || board.id,
      };

      if (board.parent_id) {
        if (!childBoardsMap[board.parent_id]) {
          childBoardsMap[board.parent_id] = [];
        }
        childBoardsMap[board.parent_id].push(safeBoard as Board);
      }
    });

    const boardLevel = getBoardLevel(board.id, boardsMap, childBoardsMap);
    const filteredBoardIds = getFilteredBoardIds(board.id, boardLevel, boardsMap, childBoardsMap);
    let normalizedFromBoardId = fromBoardId;
    const rootBoardId = findRootBoard(board.id, boardsMap);
    if (normalizedFromBoardId === 'boards' || normalizedFromBoardId === 'root') {
      normalizedFromBoardId = rootBoardId;
    }

    const boardFilter = normalizedFromBoardId && boardsMap[normalizedFromBoardId]
      ? getFilteredBoardIds(
          normalizedFromBoardId,
          getBoardLevel(normalizedFromBoardId, boardsMap, childBoardsMap),
          boardsMap,
          childBoardsMap
        )
      : filteredBoardIds;

    const pageSize = POST_DETAIL_LIST_PAGE_SIZE;
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

    const postsResult = await supabase
      .from('posts')
      .select(
        'id, title, post_number, views, likes, dislikes, created_at, updated_at, user_id, board_id, is_notice, is_must_read, notice_type, notice_boards, notice_order, notice_created_at, is_hidden, is_deleted, show_in_widget, meta, deal_info, thumbnail_url, summary, profiles(id, nickname, icon_id, level, exp, public_id)',
        { count: 'exact' }
      )
      .in('board_id', boardFilter)
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data: postsData, count } = postsResult;
    const postBoardIds = Array.from(new Set((postsData || []).map((post) => post.board_id).filter(Boolean))) as string[];
    const teamIds = Array.from(new Set(
      postBoardIds
        .map((boardId) => boardsData[boardId]?.team_id)
        .filter((id): id is number => id !== null && id !== undefined)
    ));
    const leagueIds = Array.from(new Set(
      postBoardIds
        .map((boardId) => boardsData[boardId]?.league_id)
        .filter((id): id is number => id !== null && id !== undefined)
    ));

    const [teamsResult, leaguesResult, teamLogoUrlMap, leagueLogoUrlMap, leagueLogoDarkUrlMap] = await Promise.all([
      getCachedTeamsByIds(teamIds).then(data => ({ data })),
      getCachedLeaguesByIds(leagueIds).then(data => ({ data })),
      teamIds.length > 0 ? getTeamLogoUrls(teamIds) : Promise.resolve({} as Record<number, string>),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds) : Promise.resolve({} as Record<number, string>),
      leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds, true) : Promise.resolve({} as Record<number, string>),
    ]);

    const teamsMap: Record<string, { id: number; name: string; logo: string; [key: string]: unknown }> = {};
    const teamsData = teamsResult.data || [];
    teamsData.forEach((team) => {
      teamsMap[String(team.id)] = {
        ...team,
        logo: teamLogoUrlMap[team.id] || '',
      };
    });

    const leaguesMap: Record<string, { id: number; name: string; logo: string; logo_dark?: string; [key: string]: unknown }> = {};
    const leaguesData = leaguesResult.data || [];
    leaguesData.forEach((league) => {
      leaguesMap[String(league.id)] = {
        ...league,
        logo: leagueLogoUrlMap[league.id] || '',
        logo_dark: leagueLogoDarkUrlMap[league.id] || '',
      };
    });

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

    const formattedPosts = await formatPosts(
      (postsData || []).map(p => ({
        ...p,
        is_hidden: p.is_hidden ?? undefined,
        is_deleted: p.is_deleted ?? undefined,
        profiles: oneOrNull(p.profiles) ? {
          ...oneOrNull(p.profiles),
          nickname: oneOrNull(p.profiles)?.nickname ?? null,
          public_id: oneOrNull(p.profiles)?.public_id ?? null,
          icon_id: oneOrNull(p.profiles)?.icon_id ?? null,
          level: oneOrNull(p.profiles)?.level ?? undefined,
          exp: oneOrNull(p.profiles)?.exp ?? undefined,
        } : undefined,
      })) as unknown as import('../types/post').Post[],
      commentCounts,
      boardsData,
      boardNameMap,
      teamsMap,
      leaguesMap
    );

    return {
      success: true as const,
      formattedPosts,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('게시글 상세 하단 목록 조회 오류:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : '게시글 목록을 불러오는 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 게시글 조회수 증가
 */
export async function incrementViewCount(postId: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
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
    const supabase = await getSupabaseServer()

    // 게시글 조회 — posts 메타 + posts_content 별도 조회
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        user_id,
        board_id,
        views,
        likes,
        profiles(id, username, avatar_url, full_name),
        boards(id, name, slug)
      `)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('게시글 조회 오류:', error)
      throw new Error('게시글 조회 실패')
    }

    // posts_content 별도 조회
    const { data: contentRow } = await supabase
      .from('posts_content')
      .select('content')
      .eq('post_id', postId)
      .maybeSingle();

    // 조회수 증가 (별도 쿼리)
    await supabase.rpc('increment_view_count', { post_id: postId })

    return {
      ...((data || {}) as Record<string, unknown>),
      content: contentRow?.content ?? null,
    }
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return null
  }
} 

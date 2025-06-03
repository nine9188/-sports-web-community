'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/domains/boards/utils/post/postUtils';
import type { Json } from '@/types/supabase';

// 게시글 타입 정의
export interface Post {
  id: string;
  title: string;
  created_at: string;
  formattedDate: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  author_nickname: string;
  author_id: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  views: number;
  likes: number;
  comment_count: number;
  content: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  is_hidden?: boolean;
  is_deleted?: boolean;
}

// 응답 타입 정의
export interface PostsResponse {
  data: Post[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface FetchPostsParams {
  boardId?: string;
  boardIds?: string[];
  currentBoardId?: string;
  limit?: number;
  page?: number;
  fromParam?: string;
}

// 안전한 fallback 게시물 데이터 생성 함수
function createFallbackPost(index: number): Post {
  const now = new Date().toISOString();
  return {
    id: `fallback-${index}`,
    title: '게시물을 불러오는 중입니다...',
    created_at: now,
    formattedDate: formatDate(now),
    board_id: 'fallback',
    board_name: '로딩 중',
    board_slug: 'loading',
    post_number: index,
    author_nickname: '시스템',
    author_id: 'system',
    views: 0,
    likes: 0,
    comment_count: 0,
    content: '게시물 데이터를 불러오는 중 문제가 발생했습니다.',
    team_id: null,
    league_id: null,
    team_logo: null,
    league_logo: null
  };
}

export async function fetchPosts(params: FetchPostsParams): Promise<PostsResponse> {
  try {
    const { boardId, boardIds, currentBoardId, limit = 20, page = 1, fromParam } = params;
    const offset = (page - 1) * limit;
    
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    if (!supabase) {
      return {
        data: Array(5).fill(null).map((_, i) => createFallbackPost(i+1)),
        meta: {
          totalItems: 5,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: limit
        }
      };
    }
    
    // 게시판 ID 처리
    let targetBoardIds = ['all'];
    if (boardId) {
      targetBoardIds = [boardId];
    } else if (boardIds && Array.isArray(boardIds) && boardIds.length > 0) {
      targetBoardIds = boardIds;
    }
    
    // 필터링 조건을 저장할 변수
    let currentBoardFilter = null;
    let targetBoardsFilter = null;
    
    // 게시판 필터링 적용
    if (fromParam === 'boards' && currentBoardId) {
      // from=boards인 경우 현재 게시판만 표시
      currentBoardFilter = currentBoardId;
    } else if (fromParam && fromParam !== 'boards') {
      // fromParam이 유효한 게시판 ID인 경우 해당 게시판 필터링
      const { data: fromBoardData } = await supabase
        .from('boards')
        .select('id')
        .eq('id', fromParam)
        .single();
      
      if (fromBoardData) {
        currentBoardFilter = fromParam;
      } else if (targetBoardIds[0] !== 'all') {
        targetBoardsFilter = targetBoardIds;
      }
    } else if (targetBoardIds[0] !== 'all') {
      targetBoardsFilter = targetBoardIds;
    }
    
    // 쿼리 기본 구성
    let postsQuery = supabase
      .from('posts')
      .select(`
        id, 
        title, 
        created_at, 
        updated_at,
        board_id,
        views,
        likes,
        post_number,
        user_id,
        is_hidden,
        is_deleted,
        profiles (
          id,
          nickname,
          level,
          icon_id
        ),
        content
      `)
      .order('created_at', { ascending: false });
    
    // 필터 조건 적용
    if (currentBoardFilter) {
      postsQuery = postsQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter && targetBoardsFilter.length > 0) {
      postsQuery = postsQuery.in('board_id', targetBoardsFilter);
    }
    
    // 총 게시물 수 가져오기 (페이지네이션 구현용)
    // 별도의 카운트 쿼리 생성
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true });
      
    // 동일한 필터 조건 적용
    if (currentBoardFilter) {
      countQuery = countQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter && targetBoardsFilter.length > 0) {
      countQuery = countQuery.in('board_id', targetBoardsFilter);
    }
    
    // 카운트 실행
    const { count } = await countQuery;
    const totalItems = count || 0;
    
    // 실제 데이터 쿼리에 범위 제한 추가
    const { data: postsData, error: postsError } = await postsQuery
      .range(offset, offset + limit - 1)
      .limit(limit);
    
    if (postsError) {
      throw new Error(`게시물 데이터 불러오기 오류: ${postsError.message}`);
    }
    
    // 게시물이 없는 경우
    if (!postsData || postsData.length === 0) {
      return {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          itemsPerPage: limit
        }
      };
    }
    
    // 타입 안전성을 위한 처리 - 실제 데이터가 있는지 확인 후 처리
    const hasValidData = Array.isArray(postsData) && postsData.length > 0;
    if (!hasValidData) {
      return {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          itemsPerPage: limit
        }
      };
    }
    
    // 타입 안전성을 위한 처리
    const typedPostsData = (postsData as unknown) as Array<{
      id: string;
      title?: string;
      created_at?: string;
      updated_at?: string;
      board_id?: string;
      views?: number;
      likes?: number;
      post_number?: number;
      user_id?: string;
      is_hidden?: boolean;
      is_deleted?: boolean;
      profiles?: {
        id?: string;
        nickname?: string;
        level?: number;
        icon_id?: number | null;
      };
      content?: Json;
    }>;
    
    // 게시판 정보 가져오기
    const postBoardIds = [...new Set(typedPostsData.map(post => post?.board_id).filter(Boolean))] as string[];
    let boardsData: Record<string, { name: string; team_id?: number | null; league_id?: number | null; slug: string }> = {};
    
    if (postBoardIds.length > 0) {
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, team_id, league_id, slug')
        .in('id', postBoardIds);
      
      if (!boardsError && boards) {
        boardsData = boards.reduce((acc, board) => {
          acc[board.id] = {
            name: board.name,
            team_id: board.team_id,
            league_id: board.league_id,
            slug: board.slug || board.id
          };
          return acc;
        }, {} as Record<string, { name: string; team_id?: number | null; league_id?: number | null; slug: string }>);
      }
    }
    
    // 팀/리그 로고 정보 가져오기
    const teamIds = Object.values(boardsData)
      .map(board => board.team_id)
      .filter(Boolean) as number[];
    
    const leagueIds = Object.values(boardsData)
      .map(board => board.league_id)
      .filter(Boolean) as number[];
    
    const teamLogoMap: Record<string, string> = {};
    const leagueLogoMap: Record<string, string> = {};
    
    // 팀 로고 가져오기
    if (teamIds.length > 0) {
      try {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, logo')
          .in('id', teamIds);
        
        if (teamsData) {
          teamsData.forEach(team => {
            if (team.id && team.logo) {
              teamLogoMap[team.id] = team.logo;
            }
          });
        }
      } catch {
        // 팀 로고 가져오기 실패 시 무시
      }
    }
    
    // 리그 로고 가져오기
    if (leagueIds.length > 0) {
      try {
        const { data: leaguesData } = await supabase
          .from('leagues')
          .select('id, logo')
          .in('id', leagueIds);
        
        if (leaguesData) {
          leaguesData.forEach(league => {
            if (league.id && league.logo) {
              leagueLogoMap[league.id] = league.logo;
            }
          });
        }
      } catch {
        // 리그 로고 가져오기 실패 시 무시
      }
    }
    
    // 사용자 아이콘 정보 가져오기
    const userIconMap: Record<number, string> = {};
    const userIds: string[] = typedPostsData
      .map(post => post?.user_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const userProfileMap: Record<string, { level: number; icon_id: number | null }> = {};
    
    if (userIds.length > 0) {
      try {
        // 1. 모든 사용자 프로필 정보 한 번에 가져오기 (level, icon_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, level, icon_id')
          .in('id', userIds);
        
        if (profilesData) {
          // 사용자 ID 기준으로 프로필 정보 맵 구성
          profilesData.forEach(profile => {
            if (profile.id) {
              userProfileMap[profile.id] = {
                level: profile.level || 1,
                icon_id: profile.icon_id
              };
            }
          });
        }
        
        // 2. 커스텀 아이콘이 있는 사용자만 필터링
        const iconIds = profilesData
          ?.map(profile => profile.icon_id)
          .filter(Boolean) as number[] || [];
        
        if (iconIds.length > 0) {
          // 3. 커스텀 아이콘 정보 한 번에 가져오기
          const { data: iconsData } = await supabase
            .from('shop_items')
            .select('id, image_url')
            .in('id', iconIds);
          
          if (iconsData) {
            iconsData.forEach(icon => {
              if (icon.id && icon.image_url) {
                userIconMap[icon.id] = icon.image_url;
              }
            });
          }
        }
      } catch (error) {
        console.error('아이콘 정보 가져오기 오류:', error);
        // 오류 발생해도 계속 진행 (기본 아이콘 사용)
      }
    }
    
    // 댓글 수 가져오기
    const postIds = typedPostsData.map(post => post?.id).filter(Boolean);
    
    const commentCountMap: Record<string, number> = {};
    if (postIds.length > 0) {
      try {
        // 숨김/삭제되지 않은 댓글만 카운트
        const { data: commentCounts } = await supabase
          .from('comments')
          .select('post_id, count')
          .in('post_id', postIds)
          .eq('is_hidden', false)
          .eq('is_deleted', false);
        
        if (commentCounts) {
          commentCounts.forEach((item) => {
            if (item.post_id) {
              const count = typeof item.count === 'string'
                ? parseInt(item.count, 10)
                : item.count;
              
              commentCountMap[item.post_id] = count || 0;
            }
          });
        }
      } catch {
        // 댓글 수 가져오기 실패 시 무시
      }
    }
    
    // 최종 결과 변환
    const formattedPosts = typedPostsData.map(post => {
      // 각 게시물에 대한 게시판 정보
      const boardInfo = post.board_id ? boardsData[post.board_id] : null;
      const safeBoardInfo = boardInfo || { 
        name: '알 수 없는 게시판', 
        slug: post.board_id || 'unknown',
        team_id: null,
        league_id: null
      };
      
      // 게시판이 속한 팀/리그 로고
      const teamLogo = safeBoardInfo.team_id ? teamLogoMap[safeBoardInfo.team_id] : null;
      const leagueLogo = safeBoardInfo.league_id ? leagueLogoMap[safeBoardInfo.league_id] : null;
      
      // 사용자 프로필 정보
      interface ProfileData {
        id?: string;
        nickname?: string;
        level?: number;
        icon_id?: number | null;
      }
      
      const profile = post.profiles as ProfileData | null;
      
      // 사용자 레벨 (기본값: 1)
      const userLevel = profile?.level || 1;
      
      // 아이콘 URL 생성 로직 개선
      let iconUrl: string | null = null;
      const userId = post.user_id;
      
      if (userId && userProfileMap[userId]) {
        const userProfile = userProfileMap[userId];
        
        if (userProfile.icon_id && userIconMap[userProfile.icon_id]) {
          // 커스텀 아이콘이 있는 경우
          iconUrl = userIconMap[userProfile.icon_id];
        } else {
          // 커스텀 아이콘이 없는 경우 레벨 아이콘 사용
          iconUrl = getLevelIconUrl(userProfile.level);
        }
      } else if (profile?.icon_id && userIconMap[profile.icon_id]) {
        // 프로필에서 직접 아이콘 ID를 가져온 경우
        iconUrl = userIconMap[profile.icon_id];
      } else {
        // 기본적으로 레벨 아이콘 사용
        iconUrl = getLevelIconUrl(userLevel);
      }
      
      // 제목 처리 - 숨김/삭제 상태에 따라 변경
      let displayTitle = post.title || '';
      if (post.is_deleted) {
        displayTitle = '[삭제된 게시글]';
      } else if (post.is_hidden) {
        displayTitle = '[숨김 처리된 게시글]';
      }
      
      return {
        id: post.id,
        title: displayTitle,
        created_at: post.created_at || new Date().toISOString(),
        formattedDate: formatDate(post.created_at || new Date().toISOString()),
        board_id: post.board_id || '',
        board_name: safeBoardInfo.name,
        board_slug: safeBoardInfo.slug,
        post_number: post.post_number || 0,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id || '',
        author_level: userLevel,
        author_icon_id: profile?.icon_id,
        author_icon_url: iconUrl,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCountMap[post.id] || 0,
        content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
        team_id: safeBoardInfo.team_id,
        league_id: safeBoardInfo.league_id,
        team_logo: teamLogo,
        league_logo: leagueLogo,
        is_hidden: post.is_hidden || false,
        is_deleted: post.is_deleted || false
      };
    });
    
    return {
      data: formattedPosts,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('게시물 불러오기 오류:', error);
    
    // 오류 발생 시 빈 결과 반환
    return {
      data: [],
      meta: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 20
      }
    };
  }
}

export async function revalidatePostsData(path: string = '/') {
  try {
    const { revalidatePath } = await import('next/cache');
    
    // 동적 경로인 경우 type 파라미터 추가
    if (path.includes('[') && path.includes(']')) {
      revalidatePath(path, 'page');
    } else {
      revalidatePath(path);
    }
    
    return { success: true, message: '캐시가 성공적으로 갱신됐습니다.' };
  } catch (error) {
    console.error('캐시 갱신 오류:', error);
    return { success: false, message: '캐시 갱신 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 게시판의 게시글 목록 조회
 */
export async function getPosts(boardId: string, page = 1, limit = 20) {
  try {
    const supabase = await createClient()
    
    // 페이지네이션을 위한 offset 계산
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from('posts')
      .select('id, title, created_at, user_id, view_count, like_count, is_hidden, is_deleted, profiles(username, avatar_url)', { count: 'exact' })
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('게시글 목록 조회 오류:', error)
      throw new Error('게시글 목록 조회 실패')
    }
    
    return { 
      posts: data || [], 
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
      currentPage: page
    }
  } catch (error) {
    console.error('게시글 데이터 불러오기 오류:', error)
    return { posts: [], totalCount: 0, totalPages: 0, currentPage: page }
  }
} 
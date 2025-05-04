'use server';

import { createClient } from '@/shared/api/supabaseServer';

// 게시글 타입 정의
export interface Post {
  id: string;
  title: string;
  created_at: string;
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
  return {
    id: `fallback-${index}`,
    title: '게시물을 불러오는 중입니다...',
    created_at: new Date().toISOString(),
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
    
    // 게시판 정보 가져오기
    const postBoardIds = [...new Set(postsData.map(post => post.board_id).filter(Boolean))];
    let boardsData: Record<string, { name: string; team_id?: string | null; league_id?: string | null; slug: string }> = {};
    
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
        }, {} as Record<string, { name: string; team_id?: string | null; league_id?: string | null; slug: string }>);
      }
    }
    
    // 팀/리그 로고 정보 가져오기
    const teamIds = Object.values(boardsData)
      .map(board => board.team_id)
      .filter(Boolean) as string[];
    
    const leagueIds = Object.values(boardsData)
      .map(board => board.league_id)
      .filter(Boolean) as string[];
    
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
    const userIconIds = postsData.map(post => post.profiles && 'icon_id' in post.profiles ? post.profiles.icon_id : null).filter(Boolean);
    
    if (userIconIds.length > 0) {
      try {
        const { data: iconsData } = await supabase
          .from('icons')
          .select('id, image_url')
          .in('id', userIconIds as number[]);
        
        if (iconsData) {
          iconsData.forEach(icon => {
            if (icon.id && icon.image_url) {
              userIconMap[icon.id] = icon.image_url;
            }
          });
        }
      } catch {
        // 아이콘 정보 가져오기 실패 시 무시
      }
    }
    
    // 댓글 수 가져오기
    const postIds = postsData.map(post => post.id);
    
    const commentCountMap: Record<string, number> = {};
    if (postIds.length > 0) {
      try {
        // 이 부분은 DB에 따라 달라질 수 있음 (여기서는 댓글 수 계산 쿼리 사용)
        const { data: commentCounts } = await supabase
          .from('comments')
          .select('post_id, count')
          .in('post_id', postIds);
        
        if (commentCounts) {
          commentCounts.forEach((item: { post_id: string; count: string | number }) => {
            const count = typeof item.count === 'string'
              ? parseInt(item.count, 10)
              : item.count;
            
            commentCountMap[item.post_id] = count || 0;
          });
        }
      } catch {
        // 댓글 수 가져오기 실패 시 무시
      }
    }
    
    // 최종 결과 변환
    const formattedPosts = postsData.map(post => {
      // 각 게시물에 대한 게시판 정보
      const boardInfo = boardsData[post.board_id] || { 
        name: '알 수 없는 게시판', 
        slug: post.board_id,
        team_id: null,
        league_id: null
      };
      
      // 게시판이 속한 팀/리그 로고
      const teamLogo = boardInfo.team_id ? teamLogoMap[boardInfo.team_id] : null;
      const leagueLogo = boardInfo.league_id ? leagueLogoMap[boardInfo.league_id] : null;
      
      // 사용자 프로필 정보
      interface ProfileData {
        id?: string;
        nickname?: string;
        level?: number;
        icon_id?: number | null;
      }
      
      const profile = post.profiles as ProfileData | null;
      
      // 아이콘 URL 가져오기 (직접 또는 레벨 기반)
      let iconUrl = null;
      if (profile?.icon_id && userIconMap[profile.icon_id]) {
        iconUrl = userIconMap[profile.icon_id];
      } else if (profile?.level) {
        // getLevelIconUrl이 여기서는 import되지 않았으므로 null로 설정
        // 실제로는 아이콘 가져오는 로직 추가 필요
        iconUrl = null;
      }
      
      return {
        id: post.id,
        title: post.title,
        created_at: post.created_at,
        board_id: post.board_id,
        board_name: boardInfo.name,
        board_slug: boardInfo.slug,
        post_number: post.post_number,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id || '',
        author_level: profile?.level,
        author_icon_id: profile?.icon_id,
        author_icon_url: iconUrl,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCountMap[post.id] || 0,
        content: post.content || '',
        team_id: boardInfo.team_id,
        league_id: boardInfo.league_id,
        team_logo: teamLogo,
        league_logo: leagueLogo
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
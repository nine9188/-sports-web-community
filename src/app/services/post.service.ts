import { createClient } from '@/app/lib/supabase.server';
import { FormattedPost, Post } from '@/app/types/post';
import { BoardData, TeamInfo, LeagueInfo } from '@/app/types/board';

// 게시글 가져오기
export async function getPostByNumber(boardId: string, postNumber: number) {
  try {
    // postNumber가 유효한지 검사 (0보다 커야 함)
    if (postNumber <= 0) {
      throw new Error(`유효하지 않은 게시글 번호: ${postNumber}`);
    }

  const supabase = await createClient();
    const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        id,
        nickname,
        icon_id
      ),
      board:board_id(name, id, parent_id, team_id, league_id, slug)
    `)
    .eq('board_id', boardId)
    .eq('post_number', postNumber)
      .limit(1);
      
    if (error) {
      throw new Error(error?.message || '게시글 데이터 조회 오류');
    }
    
    if (!data || data.length === 0) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    return data[0];
  } catch (err) {
    // 이미 생성된 에러는 그대로 전파
    if (err instanceof Error) {
      throw err;
    }
    // 그 외 에러는 새 에러로 래핑
    throw new Error(`게시글 조회 실패: ${String(err)}`);
  }
}

// 이전글, 다음글 정보 가져오기
export async function getAdjacentPosts(boardId: string, postNumber: number) {
  const supabase = await createClient();
  
  // 이전글
  let prevPost = null;
  try {
    const { data } = await supabase
      .from('posts')
      .select('id, title, post_number')
      .eq('board_id', boardId)
      .lt('post_number', postNumber)
      .order('post_number', { ascending: false })
      .limit(1);
    
    prevPost = data && data.length > 0 ? data[0] : null;
  } catch {
    // 에러 처리
  }
    
  // 다음글
  let nextPost = null;
  try {
    const { data } = await supabase
      .from('posts')
      .select('id, title, post_number')
      .eq('board_id', boardId)
      .gt('post_number', postNumber)
      .order('post_number', { ascending: true })
      .limit(1);
    
    nextPost = data && data.length > 0 ? data[0] : null;
  } catch {
    // 에러 처리
  }
  
  return { prevPost, nextPost };
}

// 특정 게시판 ID들에 대한 게시글 가져오기
export async function getPostsForBoardIds(boardIds: string[], page: number = 1) {
  const supabase = await createClient();
  const pageSize = 20; // 한 페이지당 20개 게시글
  const from = (page - 1) * pageSize;
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *, 
      profiles(nickname, id), 
      board:board_id(name, slug, id, team_id, league_id),
      content
    `)
    .in('board_id', boardIds)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
    
  if (error) {
    return [];
  }
  
  return posts || [];
}

// 게시글 필터링 함수
export async function getFilteredPostsByBoardHierarchy(
  currentBoardId: string,
  fromBoardId: string | undefined,
  rootBoardId: string,
  allBoardIds: string[],
  page: number = 1,
  getAllSubBoardIds: (parentId: string) => Promise<string[]>
) {
  const supabase = await createClient();
  
  // 'undefined'를 문자열로 전달받는 경우 처리
  if (fromBoardId === 'undefined') {
    fromBoardId = undefined;
  }
  
  // 출발 게시판 ID가 없거나 'boards'인 경우 모든 게시글 표시
  if (!fromBoardId || fromBoardId === 'boards' || fromBoardId === 'all') {
    const posts = await getPostsForAllBoards(allBoardIds, page);
    const totalCount = await getTotalPostCount(allBoardIds);
    return { posts, totalCount };
  }
  
  // 출발 게시판 ID가 rootBoardId인 경우 모든 게시글 표시
  if (fromBoardId === rootBoardId) {
    const posts = await getPostsForAllBoards(allBoardIds, page);
    const totalCount = await getTotalPostCount(allBoardIds);
    return { posts, totalCount };
  }
  
  // 출발 게시판 정보 확인
  const { data: fromBoard } = !fromBoardId ? { data: null } : await supabase
    .from('boards')
    .select('parent_id')
    .eq('id', fromBoardId)
    .single();
  
  if (fromBoardId && !fromBoard) {
    const posts = await getPostsForCurrentBoard(currentBoardId, rootBoardId, page, getAllSubBoardIds);
    const totalCount = await getTotalPostCount([currentBoardId]);
    return { posts, totalCount };
  }
  
  // 출발 게시판이 최상위 게시판의 직계 자식인 경우 (상위 게시판)
  if (fromBoard && fromBoard.parent_id === rootBoardId) {
    const childBoardIds = await getAllSubBoardIds(fromBoardId);
    const boardIds = [fromBoardId, ...childBoardIds];
    const posts = await getPostsForBoardIds(boardIds, page);
    const totalCount = await getTotalPostCount(boardIds);
    return { posts, totalCount };
  }
  
  // 출발 게시판이 하위 게시판인 경우
  if (fromBoard && fromBoard.parent_id && fromBoard.parent_id !== rootBoardId) {
    const posts = await getPostsForBoardIds([fromBoardId], page);
    const totalCount = await getTotalPostCount([fromBoardId]);
    return { posts, totalCount };
  }
  
  // 기본적으로 현재 게시판 기준으로 필터링
  const posts = await getPostsForCurrentBoard(currentBoardId, rootBoardId, page, getAllSubBoardIds);
  const targetBoardIds = [currentBoardId]; // 현재 게시판에 맞는 ID 배열 구성
  const totalCount = await getTotalPostCount(targetBoardIds);
  return { posts, totalCount };
}

// 모든 게시판의 게시글 가져오기
export async function getPostsForAllBoards(boardIds: string[], page: number = 1) {
  return getPostsForBoardIds(boardIds, page);
}

// 현재 게시판 기준으로 게시글 가져오기
export async function getPostsForCurrentBoard(
  currentBoardId: string, 
  rootBoardId: string, 
  page: number = 1,
  getAllSubBoardIds: (parentId: string) => Promise<string[]>
) {
  const supabase = await createClient();
  
  // 현재 게시판 정보 확인
  const { data: currentBoard } = await supabase
    .from('boards')
    .select('parent_id')
    .eq('id', currentBoardId)
    .single();
  
  if (!currentBoard) {
    return [];
  }
  
  // 현재 게시판이 최상위인 경우 모든 게시글 표시
  if (!currentBoard.parent_id) {
    // 여기서는 이미 allBoardIds가 인자로 전달되지 않으므로 임시로 현재 게시판만 포함
    return getPostsForBoardIds([currentBoardId], page);
  }
  
  // 현재 게시판이 상위 게시판인 경우 (최상위의 직계 자식)
  if (currentBoard.parent_id === rootBoardId) {
    const childBoardIds = await getAllSubBoardIds(currentBoardId);
    return getPostsForBoardIds([currentBoardId, ...childBoardIds], page);
  }
  
  // 현재 게시판이 하위 게시판인 경우
  return getPostsForBoardIds([currentBoardId], page);
}

// 게시글 총 개수 가져오기 함수
export async function getTotalPostCount(boardIds: string[]) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .in('board_id', boardIds);
    
  if (error) {
    return 0;
  }
  
  return count || 0;
}

// 댓글 가져오기
export async function getCommentsForPost(postId: string) {
  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        nickname,
        icon_id
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
    
  if (error) {
    return [];
  }
  
  return comments || [];
}

// 댓글 수 가져오기
export async function getCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds || postIds.length === 0) {
    return {};
  }
  
  const supabase = await createClient();
  const commentCounts: Record<string, number> = {};
  
  try {
    console.log(`${postIds.length}개 게시물의 댓글 수 조회 시작`);
    
    // 포스트 ID 배열을 최대 20개씩 청크로 나누기
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < postIds.length; i += chunkSize) {
      chunks.push(postIds.slice(i, i + chunkSize));
    }
    
    // 각 청크별로 병렬 처리
    await Promise.all(
      chunks.map(async (chunk) => {
        // 청크 내 모든 포스트에 대해 한 번에 쿼리
        const { data, error } = await supabase
          .from('comments')
          .select('post_id, count:id', { count: 'estimated' })
          .in('post_id', chunk);
          
        if (error) {
          console.error('댓글 수 조회 오류:', error);
          // 오류 발생 시 개별 쿼리로 대체
          await Promise.all(
            chunk.map(async (postId) => {
              const { count, error: countError } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);
                
              if (!countError) {
                commentCounts[postId] = count || 0;
              }
            })
          );
          return;
        }
        
        // 청크 데이터 처리
        if (data) {
          // 댓글 없는 게시물 초기화
          chunk.forEach(postId => {
            commentCounts[postId] = 0;
          });
          
          // 댓글 수 집계
          data.forEach(row => {
            if (row.post_id) {
              commentCounts[row.post_id] = parseInt(row.count) || 0;
            }
          });
        }
      })
    );
    
    console.log(`댓글 수 조회 완료: ${Object.keys(commentCounts).length}개`);
    return commentCounts;
  } catch (error) {
    console.error('댓글 수 조회 중 오류:', error);
    
    // 오류 발생 시 모든 게시물에 대해 개별적으로 쿼리
    await Promise.all(
      postIds.map(async (postId) => {
        try {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
            
          commentCounts[postId] = count || 0;
        } catch {
          commentCounts[postId] = 0;
        }
      })
    );
    
    return commentCounts;
  }
}

// 아이콘 정보 조회
export async function getIconUrl(iconId: number | null) {
  if (!iconId) return null;
  
  const supabase = await createClient();
  const { data: iconData } = await supabase
    .from('shop_items')
    .select('image_url')
    .eq('id', iconId)
    .single();
    
  return iconData ? iconData.image_url : null;
}

// 댓글 아이콘 URL 매핑 가져오기
export async function getCommentIconUrls(comments: { profiles?: { icon_id?: number | null } }[]) {
  const supabase = await createClient();
  
  // 댓글의 아이콘 ID 수집
  const commentIconIds = comments
    ?.filter(comment => comment.profiles?.icon_id)
    .map(comment => comment.profiles?.icon_id) 
    .filter((id): id is number => id !== undefined && id !== null);
    
  let commentIconsMap: Record<number, string> = {};
  if (commentIconIds.length > 0) {
    const { data: iconData } = await supabase
      .from('shop_items')
      .select('id, image_url')
      .in('id', commentIconIds);
      
    if (iconData) {
      commentIconsMap = iconData.reduce((acc: Record<number, string>, icon: { id: number, image_url: string }) => {
        acc[icon.id] = icon.image_url;
        return acc;
      }, {});
    }
  }
  
  // 댓글 데이터에 아이콘 URL 추가
  const commentsWithIconUrl = comments?.map(comment => ({
    ...comment,
    profiles: comment.profiles ? {
      ...comment.profiles,
      icon_url: comment.profiles?.icon_id ? commentIconsMap[comment.profiles.icon_id] : null
    } : undefined
  })) || [];
  
  return commentsWithIconUrl;
}

// 팀, 리그 정보 가져오기
export async function getTeamAndLeagueInfo(boardIds: string[]): Promise<{
  teams: Record<number, TeamInfo>;
  leagues: Record<number, LeagueInfo>;
}> {
  if (!boardIds || boardIds.length === 0) {
    return { teams: {}, leagues: {} };
  }

  const supabase = await createClient();
  
  try {
    // 간단한 접근법: 게시판 정보 확인
    const { error } = await supabase
      .from('boards')
      .select('id, team_id, league_id')
      .in('id', boardIds);

    if (error) {
      return { teams: {}, leagues: {} };
    }

    // 결과 객체 준비
    const teams: Record<number, TeamInfo> = {};
    const leagues: Record<number, LeagueInfo> = {};

    // 1. 모든 팀 정보 가져오기 (ID 필터링 없이)
    const { data: allTeams } = await supabase
      .from('teams')
      .select('id, name, logo');
    
    if (allTeams) {
      allTeams.forEach(team => {
        teams[team.id] = {
          name: team.name || '',
          logo: team.logo || ''
        };
      });
    }

    // 2. 모든 리그 정보 가져오기 (ID 필터링 없이)
    const { data: allLeagues } = await supabase
      .from('leagues')
      .select('id, name, logo');
    
    if (allLeagues) {
      allLeagues.forEach(league => {
        leagues[league.id] = {
          name: league.name || '',
          logo: league.logo || ''
        };
      });
    }
    
    return { teams, leagues };
  } catch {
    return { teams: {}, leagues: {} };
  }
}

// 포맷된 게시글 데이터로 변환
export function formatPosts(
  posts: Post[], 
  commentCounts: Record<string, number>,
  boardsData: Record<string, BoardData>,
  boardNameMap: Record<string, string>,
  teams: Record<number, TeamInfo>,
  leagues: Record<number, LeagueInfo>
): FormattedPost[] {
  return posts.map(post => {
    const boardId = post.board_id || '';
    const boardData = boardsData[boardId] || {};
    const boardName = boardNameMap[boardId] || "Unknown";
    
    // 팀 ID 추출 로직 - boardData가 있는 경우 우선 사용
    // 문자열이나 다른 유형의 값을 숫자로 변환
    const rawTeamId = boardData.team_id ?? null;
    const rawLeagueId = boardData.league_id ?? null;
    
    // 숫자 변환 및 유효성 검사
    const teamId = typeof rawTeamId === 'string' ? parseInt(rawTeamId, 10) : rawTeamId;
    const leagueId = typeof rawLeagueId === 'string' ? parseInt(rawLeagueId, 10) : rawLeagueId;
    
    // 팀과 리그 데이터를 숫자 ID로 안전하게 접근
    const validTeamId = teamId !== null && !isNaN(Number(teamId)) ? Number(teamId) : null;
    const validLeagueId = leagueId !== null && !isNaN(Number(leagueId)) ? Number(leagueId) : null;
    
    // 객체에 존재하는지 안전하게 확인 (String 키로 변환하여 확인)
    const hasTeam = validTeamId !== null && String(validTeamId) in teams;
    const hasLeague = validLeagueId !== null && String(validLeagueId) in leagues;
    
    return {
      id: post.id,
      title: post.title,
      board_id: boardId,
      board_name: boardName,
      board_slug: post.board?.slug || boardData.slug || boardId,
      post_number: post.post_number || 0,
      created_at: post.created_at,
      views: post.views || 0,
      likes: post.likes || 0,
      author_nickname: post.profiles?.nickname || '익명',
      author_id: post.profiles?.id,
      comment_count: commentCounts[post.id.toString()] || 0,
      content: post.content,
      team_id: validTeamId,
      league_id: validLeagueId,
      team_logo: hasTeam ? teams[validTeamId as number]?.logo : null,
      league_logo: hasLeague ? leagues[validLeagueId as number]?.logo : null
    };
  });
} 
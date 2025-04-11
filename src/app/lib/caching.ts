import { createClient } from '@/app/lib/supabase.server';
import { FileData } from '@/app/types/post';

// 캐시 TTL 기본값 (초 단위)
const DEFAULT_TTL = 5 * 60; // 5분

/**
 * 캐싱된 데이터를 가져오거나, 없으면 제공된 함수로 새로 조회해 캐싱하는 함수
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchData: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  let supabase;
  
  try {
    supabase = await createClient();
    
    // 1. 캐시 테이블에서 데이터 확인
    try {
      const { data: cachedItem, error } = await supabase
        .from('cache')
        .select('data, created_at')
        .eq('key', cacheKey)
        .single();
      
      // 2. 유효한 캐시가 있으면 반환
      if (!error && cachedItem && isValidCache(cachedItem.created_at, ttlSeconds)) {
        return cachedItem.data as T;
      }
    } catch (cacheReadError) {
      console.error(`캐시 읽기 오류 (${cacheKey}):`, cacheReadError);
      // 캐시 읽기 오류는 무시하고 원본 데이터를 가져옵니다
    }
    
    // 3. 캐시가 없거나 만료되었으면 새로 데이터 가져오기
    try {
      const data = await fetchData();
      
      // 4. 캐시 업데이트
      if (data) {
        // 비동기로 캐시 업데이트 (결과 기다리지 않음)
        (async () => {
          try {
            if (!supabase) supabase = await createClient();
            
            await supabase
              .from('cache')
              .upsert({
                key: cacheKey,
                data,
                created_at: new Date().toISOString()
              });
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`캐시 업데이트: ${cacheKey}`);
            }
          } catch (updateError) {
            console.error(`캐시 업데이트 오류 (${cacheKey}):`, updateError);
          }
        })();
      }
      
      return data;
    } catch (fetchError) {
      console.error(`데이터 가져오기 오류 (${cacheKey}):`, fetchError);
      throw fetchError; // 다시 던져서 상위 함수에서 처리하게 함
    }
  } catch (error) {
    console.error(`캐싱 전체 처리 오류 (${cacheKey}):`, error);
    
    // 최후의 수단으로 원본 데이터를 직접 가져오기 시도
    try {
      return await fetchData();
    } catch (finalError: unknown) {
      console.error(`최종 데이터 가져오기 오류 (${cacheKey}):`, finalError);
      // 빈 데이터 객체 반환 대신 오류를 던져서 상위 함수에서 처리하게 함
      throw new Error(`캐싱 및 데이터 가져오기 실패: ${finalError instanceof Error ? finalError.message : '알 수 없는 오류'}`);
    }
  }
}

/**
 * 게시글 상세 데이터를 캐싱하는 특수 함수
 */
export async function getCachedPostDetail(boardSlug: string, postNumber: number) {
  console.log("게시글 상세 조회:", boardSlug, postNumber);
  
  try {
    const supabase = await createClient();
    
    // 게시글 기본 정보 가져오기
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, nickname, icon_id),
        board:board_id (*, team_id, league_id)
      `)
      .eq('post_number', postNumber)
      .single();
    
    if (postError) {
      console.error(`게시글 조회 오류 (${boardSlug}/${postNumber}):`, postError);
      throw postError;
    }
    
    // 팀 정보 가져오기 (해당하는 경우)
    let teamData = null;
    if (postData.board?.team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', postData.board.team_id)
        .single();
      
      if (teamError) {
        console.error(`팀 정보 조회 오류 (team_id: ${postData.board.team_id}):`, teamError);
      } else {
        teamData = team;
        console.log("팀 정보:", teamData);
      }
    }
    
    // 리그 정보 가져오기 (해당하는 경우)
    let leagueData = null;
    if (postData.board?.league_id) {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', postData.board.league_id)
        .single();
      
      if (leagueError) {
        console.error(`리그 정보 조회 오류 (league_id: ${postData.board.league_id}):`, leagueError);
      } else {
        leagueData = league;
        console.log("리그 정보:", leagueData);
      }
    }
    
    // 첨부 파일 정보 가져오기
    let files: FileData[] = [];
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('post_files')
        .select('*')
        .eq('post_id', postData.id);
      
      if (!filesError && filesData) {
        files = filesData as FileData[];
      } else if (filesError) {
        console.error(`첨부 파일 조회 오류 (post_id: ${postData.id}):`, filesError);
      }
    } catch (fileError: unknown) {
      console.error(`첨부 파일 처리 중 오류 발생 (post_id: ${postData.id}):`, fileError);
      // 오류가 발생해도 계속 진행
    }
    
    // 게시판 로고에 대한 우선순위 결정
    // 1. 팀 로고가 있으면 팀 로고 사용
    // 2. 리그 로고가 있으면 리그 로고 사용
    // 3. 게시판 자체 로고가 있으면 게시판 로고 사용
    let boardLogoToUse = null;
    if (teamData?.logo) {
      boardLogoToUse = teamData.logo;
    } else if (leagueData?.logo) {
      boardLogoToUse = leagueData.logo;
    } else if (postData.board?.logo) {
      boardLogoToUse = postData.board.logo;
    }
    
    // 수정된 board 데이터에 로고 필드 추가
    const enhancedBoard = {
      ...postData.board,
      resolved_logo: boardLogoToUse
    };
    
    // 결과 구성
    const result = {
      post: {
        ...postData,
        files: files
      },
      author: postData.profiles,
      board: enhancedBoard,
      team: teamData,
      league: leagueData
    };
    
    console.log("게시글 상세 정보:", result);
    return result;
    
  } catch (error) {
    console.error(`게시글 캐싱 처리 실패 (${boardSlug}/${postNumber}):`, error);
    throw error;
  }
}

/**
 * 게시판 구조 데이터를 캐싱하는 함수
 */
export async function getCachedBoardStructure() {
  const cacheKey = 'board_structure';
  
  try {
    return await getCachedData(
      cacheKey,
      async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('게시판 구조 데이터 조회 오류:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('게시판 데이터가 없습니다.');
          return [];
        }
        
        return data;
      },
      30 * 60 // 게시판 구조는 30분 캐싱
    );
  } catch (error) {
    console.error('게시판 구조 캐싱 처리 실패:', error);
    // 오류 발생 시 빈 배열을 반환하여 애플리케이션이 계속 실행되도록 함
    return [];
  }
}

/**
 * 댓글 데이터를 캐싱하는 함수
 */
export async function getCachedComments(postId: string) {
  const cacheKey = `comments:${postId}`;
  
  try {
    return await getCachedData(
      cacheKey,
      async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (id, nickname, icon_id)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error(`댓글 데이터 조회 오류 (postId: ${postId}):`, error);
          throw error;
        }
        
        return data || [];
      },
      5 * 60 // 댓글은 5분 캐싱
    );
  } catch (error) {
    console.error(`댓글 캐싱 처리 실패 (postId: ${postId}):`, error);
    // 오류 발생 시 빈 배열을 반환하여 애플리케이션이 계속 실행되도록 함
    return [];
  }
}

/**
 * 캐시 항목의 유효성 확인
 */
function isValidCache(createdAt: string, ttlSeconds: number): boolean {
  try {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - created) / 1000 < ttlSeconds;
  } catch (error) {
    console.error('캐시 유효성 검사 오류:', error);
    return false; // 오류 발생 시 캐시를 유효하지 않다고 간주
  }
}

/**
 * 특정 게시글 관련 캐시 무효화 (게시글 수정/삭제 시 호출)
 */
export async function invalidatePostCache(boardSlug: string, postNumber: number) {
  try {
    const supabase = await createClient();
    const cacheKey = `post_detail:${boardSlug}:${postNumber}`;
    
    await supabase
      .from('cache')
      .delete()
      .eq('key', cacheKey);
    
    // 댓글 캐시도 함께 무효화 (게시글 ID 필요)
    const { data: post, error } = await supabase
      .from('posts')
      .select('id')
      .eq('post_number', postNumber)
      .single();
    
    if (error) {
      console.error(`캐시 무효화를 위한 게시글 조회 오류 (${boardSlug}/${postNumber}):`, error);
      return;
    }
    
    if (post) {
      await supabase
        .from('cache')
        .delete()
        .eq('key', `comments:${post.id}`);
    }
  } catch (error) {
    console.error(`게시글 캐시 무효화 오류 (${boardSlug}/${postNumber}):`, error);
  }
} 
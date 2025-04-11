import { createClientWithoutCookies } from '@/app/lib/supabase-middleware';
import { FileData } from '@/app/types/post';

// 캐시 TTL 기본값 (초 단위)
const DEFAULT_TTL = 5 * 60; // 5분

// 캐시 타입 정의
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

// 인메모리 캐시 저장소 - unknown 타입으로 대체
const memoryCache: Map<string, CacheEntry<unknown>> = new Map();

/**
 * 캐싱된 데이터를 가져오거나, 없으면 제공된 함수로 새로 조회해 캐싱하는 함수
 * 이 함수는 데이터베이스 캐싱과 메모리 캐싱을 모두 지원합니다.
 * 
 * @param cacheKey 캐시 키
 * @param fetchData 데이터를 가져오는 함수
 * @param ttlSeconds 캐시 유효 시간 (초)
 * @returns 캐시된 데이터 또는 새로 가져온 데이터
 */
export async function getCachedData<T>(
  cacheKey: string,
  fetchData: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  // 1. 먼저 메모리 캐시 확인
  const now = Date.now();
  const cachedEntry = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
  
  // 유효한, 만료되지 않은 메모리 캐시가 있으면 반환
  if (cachedEntry && cachedEntry.expiry > now) {
    return cachedEntry.data;
  }
  
  // 2. 메모리 캐시가 없으면 데이터베이스 캐시 확인
  let supabase;
  
  try {
    supabase = await createClientWithoutCookies();
    
    try {
      const { data: cachedItem, error } = await supabase
        .from('cache')
        .select('data, created_at')
        .eq('key', cacheKey)
        .single();
      
      // 유효한 DB 캐시가 있으면 메모리에도 저장하고 반환
      if (!error && cachedItem && isValidCache(cachedItem.created_at, ttlSeconds)) {
        // 메모리 캐시 업데이트
        memoryCache.set(cacheKey, {
          data: cachedItem.data as T,
          expiry: now + (ttlSeconds * 1000)
        });
        
        return cachedItem.data as T;
      }
    } catch (cacheReadError) {
      console.error(`캐시 읽기 오류 (${cacheKey}):`, cacheReadError);
    }
    
    // 3. 캐시가 없거나 만료되었으면 새로 데이터 가져오기
    try {
      const data = await fetchData();
      
      // 4. 캐시 업데이트 (메모리 + DB)
      // 메모리 캐시 업데이트
      memoryCache.set(cacheKey, {
        data,
        expiry: now + (ttlSeconds * 1000)
      });
      
      // DB 캐시 비동기 업데이트 (결과 기다리지 않음)
      if (data) {
        (async () => {
          try {
            if (!supabase) supabase = await createClientWithoutCookies();
            
            await supabase
              .from('cache')
              .upsert({
                key: cacheKey,
                data,
                created_at: new Date().toISOString()
              });
          } catch (updateError) {
            console.error(`캐시 업데이트 오류 (${cacheKey}):`, updateError);
          }
        })();
      }
      
      return data;
    } catch (fetchError) {
      console.error(`데이터 가져오기 오류 (${cacheKey}):`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error(`캐싱 전체 처리 오류 (${cacheKey}):`, error);
    
    // 최후의 수단으로 원본 데이터를 직접 가져오기 시도
    try {
      return await fetchData();
    } catch (finalError: unknown) {
      console.error(`최종 데이터 가져오기 오류 (${cacheKey}):`, finalError);
      throw new Error(`캐싱 및 데이터 가져오기 실패: ${finalError instanceof Error ? finalError.message : '알 수 없는 오류'}`);
    }
  }
}

/**
 * 게시글 상세 데이터를 캐싱하는 특수 함수
 */
export async function getCachedPostDetail(boardSlug: string, postNumber: number) {
  try {
    const supabase = await createClientWithoutCookies();
    
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
      
      if (!teamError) {
        teamData = team;
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
      
      if (!leagueError) {
        leagueData = league;
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
      }
    } catch {
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
    
    return result;
    
  } catch (error) {
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
        const supabase = await createClientWithoutCookies();
        const { data, error } = await supabase
          .from('boards')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        return data;
      },
      30 * 60 // 게시판 구조는 30분 캐싱
    );
  } catch {
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
        const supabase = await createClientWithoutCookies();
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (id, nickname, icon_id)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        return data || [];
      },
      5 * 60 // 댓글은 5분 캐싱
    );
  } catch {
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
  } catch {
    return false; // 오류 발생 시 캐시를 유효하지 않다고 간주
  }
}

/**
 * 특정 게시글 관련 캐시 무효화 (게시글 수정/삭제 시 호출)
 */
export async function invalidatePostCache(boardSlug: string, postNumber: number) {
  try {
    const supabase = await createClientWithoutCookies();
    const cacheKey = `post_detail:${boardSlug}:${postNumber}`;
    
    // 메모리 캐시 삭제
    memoryCache.delete(cacheKey);
    
    // DB 캐시 삭제
    await supabase
      .from('cache')
      .delete()
      .eq('key', cacheKey);
    
    // 게시판 및 인기글 관련 캐시도 같이 무효화
    invalidateCache(`board_posts:${boardSlug}`);
    
    const topicCacheKeys = ['topic_posts:views', 'topic_posts:likes', 'topic_posts:comments'];
    topicCacheKeys.forEach(key => invalidateCache(key));
    
  } catch {
    // 오류가 발생해도 계속 진행
  }
}

/**
 * 특정 캐시 항목 무효화
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * 특정 접두사로 시작하는 모든 캐시 항목 무효화
 */
export function invalidateCacheByPrefix(keyPrefix: string): void {
  // 메모리 캐시 제거
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * 모든 캐시를 무효화합니다.
 */
export function clearAllCache(): void {
  memoryCache.clear();
}
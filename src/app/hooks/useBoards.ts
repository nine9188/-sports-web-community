'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

// 게시판 타입 정의
export interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  team_id?: number | null;
  league_id?: number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

// 계층형 게시판 타입
export interface HierarchicalBoard extends Board {
  children?: HierarchicalBoard[];
}

// 게시판 데이터 응답 타입
export interface BoardsResponse {
  rootBoards: HierarchicalBoard[];
  boardsMap?: Record<string, HierarchicalBoard>;
  allBoards?: Board[];
}

// 훅 옵션 타입
interface UseBoardsOptions {
  initialData?: BoardsResponse;
}

// 캐시 키 상수 정의
export const BOARDS_QUERY_KEY = ['boards'];

// 게시판 데이터 fetch 함수 (코드 재사용을 위해 분리)
async function fetchBoards(): Promise<BoardsResponse> {
  try {
    // 캐시 적용된 fetch 요청
    const response = await fetch('/api/boards/list', {
      next: { revalidate: 3600 }, // 1시간으로 재검증 시간 증가
      cache: 'force-cache',
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '게시판 데이터를 가져오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    // 로컬 스토리지에 백업 저장 (네트워크 오류 대비)
    try {
      localStorage.setItem('boards_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // 로컬 스토리지 오류는 무시
    }
    
    return data;
  } catch (error) {
    // 네트워크 오류 시 로컬 스토리지에서 복구 시도
    try {
      const cachedData = localStorage.getItem('boards_cache');
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // 캐시가 24시간 이내인 경우에만 사용
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log('API 오류로 인해 로컬 캐시에서 게시판 데이터 복구');
          return data;
        }
      }
    } catch {
      // 로컬 스토리지 읽기 오류도 무시
    }
    
    // 로컬 캐시도 없으면 오류 전파
    throw error;
  }
}

// 게시판 데이터 훅
export function useBoards(options?: UseBoardsOptions) {
  return useQuery<BoardsResponse, Error>({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: fetchBoards,
    staleTime: 1000 * 60 * 60, // 1시간 동안 최신 상태로 간주
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지
    retry: 3,
    initialData: options?.initialData
  });
}

// 게시판 캐시 갱신 훅
export function useBoardsCache() {
  const queryClient = useQueryClient();
  
  // 캐시 무효화 함수
  const invalidateBoardsCache = async () => {
    await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    // 로컬 스토리지 캐시도 삭제
    try {
      localStorage.removeItem('boards_cache');
      localStorage.removeItem('boards_nav_cache');
      localStorage.removeItem('boards_header_cache');
      localStorage.removeItem('boards_expanded_state');
    } catch {
      // 오류 무시
    }
    return true;
  };
  
  // 캐시 갱신 함수 (새로운 데이터 패치)
  const refreshBoardsCache = async () => {
    try {
      await queryClient.fetchQuery({ 
        queryKey: BOARDS_QUERY_KEY,
        queryFn: fetchBoards
      });
      return true;
    } catch (error) {
      console.error('게시판 캐시 갱신 오류:', error);
      return false;
    }
  };
  
  return {
    invalidateBoardsCache,
    refreshBoardsCache
  };
} 
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BoardsResponse } from '../lib/types';

// 클라이언트에서 필요한 타입만 다시 export
export type { HierarchicalBoard, Board, BoardsResponse } from '../lib/types';

// 캐시 키 상수 정의
export const BOARDS_QUERY_KEY = ['boards'];

// 게시판 데이터 훅 옵션 타입
interface UseBoardsOptions {
  initialData?: BoardsResponse;
}

// 클라이언트에서 필요한 경우 API 폴백 구현 (이 함수는 Server Action 실패 시에만 사용됨)
async function fetchBoardsFromApi(): Promise<BoardsResponse> {
  try {
    // API 호출 방식
    const response = await fetch('/api/boards/list', {
      next: { revalidate: 3600 }, 
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
    
    // 로컬 스토리지에 백업 저장
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
    // 로컬 스토리지에서 복구 시도
    try {
      const cachedData = localStorage.getItem('boards_cache');
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log('API 오류로 인해 로컬 캐시에서 게시판 데이터 복구');
          return data;
        }
      }
    } catch {
      // 무시
    }
    
    throw error;
  }
}

// 게시판 데이터 훅 (Server Action이 도입되면서 이 훅은 사용되지 않지만, 
// 혹시 API 폴백이 필요한 경우를 위해 남겨둠)
export function useBoards(options?: UseBoardsOptions) {
  return useQuery<BoardsResponse, Error>({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: fetchBoardsFromApi,
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
  
  // 캐시 갱신 함수
  const refreshBoardsCache = async () => {
    try {
      await queryClient.fetchQuery({ 
        queryKey: BOARDS_QUERY_KEY,
        queryFn: fetchBoardsFromApi
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
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BoardsResponse } from '@/domains/boards/types';
import { getBoards } from '@/domains/boards/actions'; // 서버 액션 import

// 클라이언트에서 필요한 타입만 다시 export
export type { HierarchicalBoard, Board, BoardsResponse } from '@/domains/boards/types';

// 캐시 키 상수 정의
export const BOARDS_QUERY_KEY = ['boards'];

// 게시판 데이터 훅 옵션 타입
interface UseBoardsOptions {
  initialData?: BoardsResponse;
}

// 게시판 데이터 훅 (Server Action이 도입되면서 이 훅은 사용되지 않지만, 
// 혹시 API 폴백이 필요한 경우를 위해 남겨둠)
export function useBoards(options?: UseBoardsOptions) {
  return useQuery<BoardsResponse, Error>({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: async () => {
      // 서버 액션 직접 호출
      const data = await getBoards();
      return data;
    },
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
    return true;
  };
  
  // 캐시 갱신 함수
  const refreshBoardsCache = async () => {
    try {
      await queryClient.fetchQuery({ 
        queryKey: BOARDS_QUERY_KEY,
        queryFn: async () => {
          const data = await getBoards();
          return data;
        }
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
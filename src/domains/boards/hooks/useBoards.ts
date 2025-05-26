'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BoardsResponse } from '@/domains/boards/types';

// 클라이언트에서 필요한 타입만 다시 export
export type { HierarchicalBoard, Board, BoardsResponse } from '@/domains/boards/types';

// 캐시 키 상수 정의
export const BOARDS_QUERY_KEY = ['boards'];

// 게시판 데이터 훅 옵션 타입
interface UseBoardsOptions {
  initialData?: BoardsResponse; // 선택적으로 변경
}

// 게시판 데이터 훅 (서버 컴포넌트에서 전달받은 초기 데이터 사용)
export function useBoards(options?: UseBoardsOptions) {
  return useQuery<BoardsResponse, Error>({
    queryKey: BOARDS_QUERY_KEY,
    queryFn: async () => {
      // 클라이언트에서는 서버 액션을 직접 호출하지 않음
      // 대신 서버 컴포넌트에서 전달받은 초기 데이터를 사용
      throw new Error('클라이언트에서 서버 액션 직접 호출 불가 - 서버 컴포넌트에서 데이터를 전달받아야 합니다');
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 최신 상태로 간주
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지
    retry: false, // 에러 시 재시도 하지 않음
    initialData: options?.initialData || {
      boards: [],
      hierarchical: []
    }, // 기본값 제공
    enabled: false // 자동 refetch 비활성화
  });
}

// 게시판 캐시 갱신 훅 (서버 액션 기반)
export function useBoardsCache() {
  const queryClient = useQueryClient();
  
  // 캐시 무효화 함수
  const invalidateBoardsCache = async () => {
    await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
    return true;
  };
  
  // 서버 컴포넌트에서 새로운 데이터를 받아서 캐시 업데이트
  const updateBoardsCache = (newData: BoardsResponse) => {
    queryClient.setQueryData(BOARDS_QUERY_KEY, newData);
  };
  
  return {
    invalidateBoardsCache,
    updateBoardsCache
  };
} 
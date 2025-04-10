'use client';

import { useQuery } from '@tanstack/react-query';

// 게시판 타입 정의
export interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  team_id?: string | null;
  league_id?: string | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

// 계층형 게시판 타입
export interface HierarchicalBoard extends Board {
  children?: HierarchicalBoard[];
}

// 게시판 데이터 응답 타입
interface BoardsResponse {
  rootBoards: HierarchicalBoard[];
  boardsMap: Record<string, HierarchicalBoard>;
  allBoards: Board[];
}

// 게시판 데이터 fetch 함수 (코드 재사용을 위해 분리)
async function fetchBoards(): Promise<BoardsResponse> {
  console.time('게시판 목록 가져오기');
  
  // 캐시 적용된 fetch 요청
  const response = await fetch('/api/boards/list', {
    next: { revalidate: 300 }, // 5분마다 재검증 
    cache: 'force-cache',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '게시판 데이터를 가져오는데 실패했습니다.');
  }
  
  const data = await response.json();
  console.timeEnd('게시판 목록 가져오기');
  
  return data;
}

// 게시판 데이터 훅
export function useBoards() {
  return useQuery<BoardsResponse, Error>({
    queryKey: ['boards'],
    queryFn: fetchBoards,
    staleTime: 1000 * 60 * 5, // 5분 동안 최신 상태로 간주
    gcTime: 1000 * 60 * 30,   // 30분 동안 캐시 유지
    retry: 3
  });
} 
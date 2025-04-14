'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

export interface Post {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  author_nickname: string;
  author_id?: string;
  views: number;
  likes: number;
  comment_count: number;
  content?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

interface PostsResponse {
  data: Post[];
}

interface PostsQueryParams {
  boardId?: string;
  boardIds?: string[];
  currentBoardId?: string;
  limit?: number;
  offset?: number;
  fromParam?: string;
}

interface PostsRequestBody {
  boardIds: string[];
  currentBoardId?: string;
  limit: number;
  offset: number;
  fromParam?: string;
}

// 게시글 목록 가져오기 함수
export const fetchPosts = async (params: PostsQueryParams): Promise<PostsResponse> => {
  const { boardId, boardIds, currentBoardId, limit = 20, offset = 0, fromParam } = params;
  
  try {
    // 요청 본문 구성
    const requestBody: PostsRequestBody = {
      boardIds: ['all'], // 기본값으로 'all' 설정
      limit,
      offset
    };
    
    // boardIds가 유효한 배열인지 확인
    if (boardId) {
      requestBody.boardIds = [boardId];
    } else if (boardIds && Array.isArray(boardIds) && boardIds.length > 0) {
      requestBody.boardIds = boardIds;
    }
    
    if (currentBoardId) {
      requestBody.currentBoardId = currentBoardId;
    }
    
    // from 파라미터 추가
    if (fromParam) {
      requestBody.fromParam = fromParam;
    }
    
    // POST 요청 설정
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };
    
    // API 요청
    const response = await fetch('/api/posts/list', requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error('서버 응답 형식이 올바르지 않습니다.');
      }
      
      throw new Error(errorData.error || '게시글을 가져오는데 실패했습니다.');
    }
    
    const responseData = await response.json();
    
    // 응답 데이터 구조 확인
    if (!responseData.data || !Array.isArray(responseData.data)) {
      return { data: [] }; // 기본값 반환
    }
    
    return responseData;
  } catch (error) {
    throw error;
  }
};

// 기본 페이지네이션 훅
export function usePosts(params: PostsQueryParams) {
  return useQuery<PostsResponse, Error>({
    queryKey: ['posts', params],
    queryFn: () => fetchPosts(params),
    staleTime: 1000 * 60 * 1, // 1분 동안 최신 상태 유지
    placeholderData: (previousData) => previousData // keepPreviousData 대체
  });
}

// 무한 스크롤 훅
export function useInfinitePosts(params: PostsQueryParams) {
  const { limit = 20 } = params;
  
  return useInfiniteQuery<PostsResponse, Error>({
    queryKey: ['infinitePosts', params],
    queryFn: ({ pageParam }) => fetchPosts({ 
      ...params, 
      offset: pageParam as number * limit 
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.data && lastPage.data.length === limit ? allPages.length : undefined;
    },
    staleTime: 1000 * 60 * 1 // 1분 동안 최신 상태 유지
  });
} 
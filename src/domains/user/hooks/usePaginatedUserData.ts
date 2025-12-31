'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserPosts, getUserCommentedPosts } from '../actions';
import { Post } from '@/domains/boards/components/post/postlist/types';
import { PaginationParams, ActionResponse } from '../types';

const ITEMS_PER_PAGE = 20;

interface UsePaginatedUserDataResult {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number) => void;
  refresh: () => void;
}

type FetcherType = (
  publicId: string,
  pagination: PaginationParams
) => Promise<ActionResponse<Post[]>>;

/**
 * 유저 데이터 페이지네이션 훅
 * BoardDetailLayout 패턴과 동일하게 데이터 페칭 로직 분리
 * @param enabled - false면 데이터를 로드하지 않음 (비활성 탭용)
 */
function usePaginatedUserData(
  publicId: string,
  fetcher: FetcherType,
  enabled: boolean = true
): UsePaginatedUserDataResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(publicId, { page: currentPage, limit: ITEMS_PER_PAGE });
      if (result.success && result.data) {
        setPosts(result.data);
        setTotalCount(result.totalCount || 0);
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [publicId, currentPage, fetcher]);

  // enabled가 true일 때만 데이터 로드
  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled, publicId, currentPage]); // loadData 대신 의존성 직접 지정

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    posts,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setPage,
    refresh: loadData
  };
}

/**
 * 유저 게시글 목록 훅
 * @param enabled - 활성화 여부 (비활성 탭에서는 false로 설정)
 */
export function useUserPosts(publicId: string, enabled: boolean = true): UsePaginatedUserDataResult {
  return usePaginatedUserData(publicId, getUserPosts, enabled);
}

/**
 * 유저 댓글 게시글 목록 훅
 * @param enabled - 활성화 여부 (비활성 탭에서는 false로 설정)
 */
export function useUserComments(publicId: string, enabled: boolean = true): UsePaginatedUserDataResult {
  return usePaginatedUserData(publicId, getUserCommentedPosts, enabled);
}

export type { UsePaginatedUserDataResult };

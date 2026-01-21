'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotices, setPostAsNotice, removeNotice, updateNoticeType, getPostIdByNumber } from '@/domains/boards/actions/posts';
import { getBoards } from '@/domains/boards/actions/getBoards';
import { adminKeys, boardKeys } from '@/shared/constants/queryKeys';
import type { NoticeType } from '@/domains/boards/types/post';

export function useAdminNotices() {
  return useQuery({
    queryKey: adminKeys.notices(),
    queryFn: () => getNotices(),
    staleTime: 1000 * 60 * 2, // 2분
  });
}

export function useBoardsForNotice() {
  return useQuery({
    queryKey: boardKeys.list(),
    queryFn: async () => {
      const result = await getBoards();
      return result.boards.map((board) => ({
        id: board.id,
        name: board.name,
        slug: board.slug || '',
      }));
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useSetNoticeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      noticeType,
      boardIds,
      noticeOrder,
      isMustRead,
    }: {
      postId: string;
      noticeType: NoticeType;
      boardIds?: string[];
      noticeOrder?: number;
      isMustRead?: boolean;
    }) => {
      return setPostAsNotice(postId, noticeType, boardIds, noticeOrder, isMustRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notices() });
    },
  });
}

export function useSetNoticeByNumberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postNumber,
      noticeType,
      boardIds,
      noticeOrder,
      isMustRead,
    }: {
      postNumber: number;
      noticeType: NoticeType;
      boardIds?: string[];
      noticeOrder?: number;
      isMustRead?: boolean;
    }) => {
      // 게시글 번호로 ID 조회
      const lookupResult = await getPostIdByNumber(postNumber);
      if (!lookupResult.success) {
        return { success: false, message: lookupResult.error };
      }
      // 공지 설정
      return setPostAsNotice(lookupResult.postId, noticeType, boardIds, noticeOrder, isMustRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notices() });
    },
  });
}

export function useRemoveNoticeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => removeNotice(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notices() });
    },
  });
}

export function useUpdateNoticeTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      noticeType,
      boardIds,
    }: {
      postId: string;
      noticeType: NoticeType;
      boardIds?: string[];
    }) => {
      return updateNoticeType(postId, noticeType, boardIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notices() });
    },
  });
}

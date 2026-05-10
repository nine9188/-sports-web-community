'use client';

import { useEffect } from 'react';
import {
  getNotices,
  setPostAsNotice,
  removeNotice,
  updateNoticeType,
  getPostIdByNumber,
  toggleWidgetVisibility,
} from '@/domains/boards/actions/posts';
import { getBoards } from '@/domains/boards/actions/getBoards';
import type { NoticeType } from '@/domains/boards/types/post';
import { useAsyncData, useAsyncMutation } from './useLocalAsync';

const listeners = new Set<() => void>();

function notifyNoticesChanged() {
  listeners.forEach((listener) => listener());
}

export function useAdminNotices() {
  const query = useAsyncData(() => getNotices());

  useEffect(() => {
    listeners.add(query.refetch);
    return () => {
      listeners.delete(query.refetch);
    };
  }, [query.refetch]);

  return query;
}

export function useBoardsForNotice() {
  return useAsyncData(async () => {
    const result = await getBoards();
    return result.boards.map((board) => ({
      id: board.id,
      name: board.name,
      slug: board.slug || '',
      parent_id: board.parent_id || null,
    }));
  });
}

export function useSetNoticeMutation() {
  return useAsyncMutation(
    async ({
      postId,
      noticeType,
      boardIds,
      noticeOrder,
      isMustRead,
      showInWidget,
    }: {
      postId: string;
      noticeType: NoticeType;
      boardIds?: string[];
      noticeOrder?: number;
      isMustRead?: boolean;
      showInWidget?: boolean;
    }) => setPostAsNotice(postId, noticeType, boardIds, noticeOrder, isMustRead, showInWidget),
    notifyNoticesChanged
  );
}

export function useSetNoticeByNumberMutation() {
  return useAsyncMutation(
    async ({
      postNumber,
      noticeType,
      boardIds,
      noticeOrder,
      isMustRead,
      showInWidget,
    }: {
      postNumber: number;
      noticeType: NoticeType;
      boardIds?: string[];
      noticeOrder?: number;
      isMustRead?: boolean;
      showInWidget?: boolean;
    }) => {
      const lookupResult = await getPostIdByNumber(postNumber);
      if (!lookupResult.success) {
        return { success: false, message: lookupResult.error };
      }

      return setPostAsNotice(
        lookupResult.postId,
        noticeType,
        boardIds,
        noticeOrder,
        isMustRead,
        showInWidget
      );
    },
    notifyNoticesChanged
  );
}

export function useRemoveNoticeMutation() {
  return useAsyncMutation((postId: string) => removeNotice(postId), notifyNoticesChanged);
}

export function useToggleWidgetMutation() {
  return useAsyncMutation(
    async ({ postId, showInWidget }: { postId: string; showInWidget: boolean }) =>
      toggleWidgetVisibility(postId, showInWidget),
    notifyNoticesChanged
  );
}

export function useUpdateNoticeTypeMutation() {
  return useAsyncMutation(
    async ({
      postId,
      noticeType,
      boardIds,
    }: {
      postId: string;
      noticeType: NoticeType;
      boardIds?: string[];
    }) => updateNoticeType(postId, noticeType, boardIds),
    notifyNoticesChanged
  );
}

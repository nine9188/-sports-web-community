'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount } from '../actions';
import { Notification } from '../types/notification';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (limit: number) => [...notificationKeys.all, 'list', limit] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * 알림 목록을 가져오는 훅
 * - NotificationBell (limit: 20)
 * - NotificationsPage (limit: 100)
 */
export function useNotifications(limit: number = 20, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: notificationKeys.list(limit),
    queryFn: async (): Promise<NotificationsData> => {
      const result = await getNotifications(limit);
      if (result.success && result.notifications) {
        return {
          notifications: result.notifications,
          unreadCount: result.unreadCount || 0,
        };
      }
      throw new Error(result.error || '알림을 불러오는데 실패했습니다.');
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2분 (알림은 자주 확인)
    gcTime: 1000 * 60 * 10, // 10분
  });
}

/**
 * 읽지 않은 알림 개수만 가져오는 훅
 */
export function useUnreadNotificationCount(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async (): Promise<number> => {
      const result = await getUnreadNotificationCount();
      if (result.success) {
        return result.count || 0;
      }
      throw new Error(result.error || '알림 개수를 불러오는데 실패했습니다.');
    },
    enabled,
    staleTime: 1000 * 60 * 1, // 1분
    gcTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 알림 캐시를 업데이트하는 유틸리티 훅
 * - 실시간 구독에서 새 알림이 들어올 때 사용
 * - 알림 읽음/삭제 처리 시 사용
 */
export function useNotificationCache() {
  const queryClient = useQueryClient();

  // 새 알림 추가 (실시간 구독용)
  const addNotification = (notification: Notification) => {
    // 모든 알림 목록 쿼리 업데이트
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          notifications: [notification, ...oldData.notifications],
          unreadCount: oldData.unreadCount + 1,
        };
      }
    );
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId: string) => {
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        const wasUnread = oldData.notifications.find(n => n.id === notificationId && !n.is_read);
        return {
          notifications: oldData.notifications.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
        };
      }
    );
  };

  // 전체 읽음 처리
  const markAllAsRead = () => {
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          notifications: oldData.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0,
        };
      }
    );
  };

  // 알림 삭제
  const deleteNotifications = (notificationIds: string[]) => {
    const idsSet = new Set(notificationIds);
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        const deletedUnreadCount = oldData.notifications.filter(
          n => idsSet.has(n.id) && !n.is_read
        ).length;
        return {
          notifications: oldData.notifications.filter(n => !idsSet.has(n.id)),
          unreadCount: Math.max(0, oldData.unreadCount - deletedUnreadCount),
        };
      }
    );
  };

  // unreadCount만 증가 (실시간 구독용 - 목록 열리지 않았을 때)
  const incrementUnreadCount = () => {
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          unreadCount: oldData.unreadCount + 1,
        };
      }
    );
  };

  // 쿼리 무효화 (새로고침)
  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };

  return {
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    incrementUnreadCount,
    invalidateNotifications,
  };
}

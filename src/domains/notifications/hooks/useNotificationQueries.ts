'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount } from '../actions';
import { Notification } from '../types/notification';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (limit: number) => [...notificationKeys.all, 'list', limit] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

const notificationQueryDefaults = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

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
      throw new Error(result.error || '알림을 불러오는 데 실패했습니다.');
    },
    enabled,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    ...notificationQueryDefaults,
  });
}

export function useUnreadNotificationCount(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async (): Promise<number> => {
      const result = await getUnreadNotificationCount();
      if (result.success) {
        return result.count || 0;
      }
      throw new Error(result.error || '알림 개수를 불러오는 데 실패했습니다.');
    },
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    ...notificationQueryDefaults,
  });
}

export function useNotificationCache() {
  const queryClient = useQueryClient();

  const addNotification = (notification: Notification) => {
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

  const markAsRead = (notificationId: string) => {
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        const wasUnread = oldData.notifications.find((n) => n.id === notificationId && !n.is_read);
        return {
          notifications: oldData.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
        };
      }
    );
  };

  const markAllAsRead = () => {
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          notifications: oldData.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        };
      }
    );
  };

  const deleteNotifications = (notificationIds: string[]) => {
    const idsSet = new Set(notificationIds);
    queryClient.setQueriesData<NotificationsData>(
      { queryKey: notificationKeys.all },
      (oldData) => {
        if (!oldData) return oldData;
        const deletedUnreadCount = oldData.notifications.filter(
          (n) => idsSet.has(n.id) && !n.is_read
        ).length;
        return {
          notifications: oldData.notifications.filter((n) => !idsSet.has(n.id)),
          unreadCount: Math.max(0, oldData.unreadCount - deletedUnreadCount),
        };
      }
    );
  };

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

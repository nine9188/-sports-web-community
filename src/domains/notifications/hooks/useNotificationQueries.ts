'use client';

import { useCallback, useEffect, useState } from 'react';
import { getNotifications, getUnreadNotificationCount } from '../actions';
import { Notification } from '../types/notification';

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

type NotificationListener = (updater: (oldData?: NotificationsData) => NotificationsData | undefined) => void;
const notificationListeners = new Set<NotificationListener>();
const unreadCountListeners = new Set<(updater: (oldCount: number) => number) => void>();

export function useNotifications(limit: number = 20, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<NotificationsData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setIsFetching(true);
      setError(null);
      try {
        const result = await getNotifications(limit);
        if (!result.success || !result.notifications) {
          throw new Error(result.error || 'Failed to load notifications');
        }
        if (!cancelled) {
          setData({
            notifications: result.notifications,
            unreadCount: result.unreadCount || 0,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load notifications'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, limit, version]);

  useEffect(() => {
    const listener: NotificationListener = updater => {
      setData(oldData => updater(oldData));
    };
    notificationListeners.add(listener);
    return () => {
      notificationListeners.delete(listener);
    };
  }, []);

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useUnreadNotificationCount(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const result = await getUnreadNotificationCount();
        if (!result.success) {
          throw new Error(result.error || 'Failed to load unread notification count');
        }
        if (!cancelled) setData(result.count || 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load unread notification count'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, version]);

  useEffect(() => {
    const listener = (updater: (oldCount: number) => number) => {
      setData(updater);
    };
    unreadCountListeners.add(listener);
    return () => {
      unreadCountListeners.delete(listener);
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export function useNotificationCache() {
  const updateNotifications = (updater: (oldData?: NotificationsData) => NotificationsData | undefined) => {
    notificationListeners.forEach(listener => listener(updater));
  };

  const updateUnreadCount = (updater: (oldCount: number) => number) => {
    unreadCountListeners.forEach(listener => listener(updater));
  };

  const addNotification = (notification: Notification) => {
    updateNotifications(oldData => {
      if (!oldData) return oldData;
      return {
        notifications: [notification, ...oldData.notifications],
        unreadCount: oldData.unreadCount + 1,
      };
    });
    updateUnreadCount(count => count + 1);
  };

  const markAsRead = (notificationId: string) => {
    updateNotifications(oldData => {
      if (!oldData) return oldData;
      const wasUnread = oldData.notifications.find(item => item.id === notificationId && !item.is_read);
      return {
        notifications: oldData.notifications.map(item =>
          item.id === notificationId ? { ...item, is_read: true } : item
        ),
        unreadCount: wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
      };
    });
    updateUnreadCount(count => Math.max(0, count - 1));
  };

  const markAllAsRead = () => {
    updateNotifications(oldData => {
      if (!oldData) return oldData;
      return {
        notifications: oldData.notifications.map(item => ({ ...item, is_read: true })),
        unreadCount: 0,
      };
    });
    updateUnreadCount(() => 0);
  };

  const deleteNotifications = (notificationIds: string[]) => {
    const idsSet = new Set(notificationIds);
    updateNotifications(oldData => {
      if (!oldData) return oldData;
      const deletedUnreadCount = oldData.notifications.filter(item => idsSet.has(item.id) && !item.is_read).length;
      updateUnreadCount(count => Math.max(0, count - deletedUnreadCount));
      return {
        notifications: oldData.notifications.filter(item => !idsSet.has(item.id)),
        unreadCount: Math.max(0, oldData.unreadCount - deletedUnreadCount),
      };
    });
  };

  const incrementUnreadCount = () => {
    updateNotifications(oldData => oldData ? { ...oldData, unreadCount: oldData.unreadCount + 1 } : oldData);
    updateUnreadCount(count => count + 1);
  };

  const invalidateNotifications = () => {};

  return {
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    incrementUnreadCount,
    invalidateNotifications,
  };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, ChevronDown } from 'lucide-react';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/domains/notifications/actions/read';
import { deleteNotifications } from '@/domains/notifications/actions/delete';
import { NotificationType, Notification } from '@/domains/notifications/types/notification';
import NotificationItem from '@/domains/notifications/components/NotificationItem';
import { Button, Pagination, TabList, type TabItem } from '@/shared/components/ui';
import { useNotificationCache } from '@/domains/notifications/hooks/useNotificationQueries';

const ITEMS_PER_PAGE = 15;

type FilterType = 'all' | 'unread';
type TypeFilter = 'all' | NotificationType;

const notificationTypeLabels: Record<TypeFilter, string> = {
  all: '전체 알림',
  comment: '댓글',
  reply: '답글',
  post_like: '게시글 좋아요',
  comment_like: '댓글 좋아요',
  level_up: '레벨업',
  report_result: '신고 결과',
  admin_notice: '관리자 공지',
  welcome: '환영',
  hot_post: '인기 게시글',
  profile_update: '프로필 업데이트',
  suspension: '계정 정지',
  phone_verified: '휴대폰 인증',
};

interface NotificationsPageClientProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  initialError?: string | null;
}

export default function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
  initialError = null,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    markAsRead,
    markAllAsRead,
    deleteNotifications: deleteFromCache,
  } = useNotificationCache();

  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markAsRead(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const confirmMessage = `${unreadCount}개의 읽지 않은 알림을 모두 읽음 처리하시겠습니까?`;
    if (!window.confirm(confirmMessage)) return;

    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
      markAllAsRead();
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedNotifications.forEach((notification) => next.delete(notification.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedNotifications.forEach((notification) => next.add(notification.id));
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmMessage = `선택한 ${selectedIds.size}개의 알림을 삭제하시겠습니까?\n삭제된 알림은 복구할 수 없습니다.`;
    if (!window.confirm(confirmMessage)) return;

    const idsToDelete = Array.from(selectedIds);
    const result = await deleteNotifications(idsToDelete);

    if (result.success) {
      const deletedSet = new Set(idsToDelete);
      const deletedUnreadCount = notifications.filter(
        (notification) => deletedSet.has(notification.id) && !notification.is_read
      ).length;

      setNotifications((prev) => prev.filter((notification) => !deletedSet.has(notification.id)));
      setUnreadCount((prev) => Math.max(0, prev - deletedUnreadCount));
      setSelectedIds(new Set());
      deleteFromCache(idsToDelete);
    } else {
      alert(result.error || '알림 삭제에 실패했습니다.');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === 'unread' && notification.is_read) return false;
      if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, filter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const isAllSelected =
    paginatedNotifications.length > 0 &&
    paginatedNotifications.every((notification) => selectedIds.has(notification.id));
  const filterTabs: TabItem[] = [
    { id: 'all', label: '전체', count: notifications.length },
    { id: 'unread', label: '읽지 않음', count: unreadCount },
  ];

  if (initialError) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] md:border md:border-black/7 md:dark:border-0 md:rounded-lg p-6">
        <div className="text-[13px] text-gray-500 dark:text-gray-400">{initialError}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-[#1D1D1D] md:border md:border-black/7 md:dark:border-0 md:rounded-lg">
        <div className="h-12 px-4 bg-[#F5F5F5] dark:bg-[#262626] md:rounded-t-lg border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 flex-shrink-0 text-gray-900 dark:text-[#F0F0F0]" />
            <h1 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0] flex-shrink-0">알림</h1>
            {unreadCount > 0 && (
              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                {unreadCount}개의 읽지 않은 알림
              </span>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 h-auto"
            >
              {notificationTypeLabels[typeFilter]}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                  {(Object.keys(notificationTypeLabels) as TypeFilter[]).map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      onClick={() => {
                        setTypeFilter(type);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full justify-start px-3 py-2 text-xs h-auto rounded-none ${
                        typeFilter === type
                          ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
                      }`}
                    >
                      {notificationTypeLabels[type]}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <TabList
          tabs={filterTabs}
          activeTab={filter}
          onTabChange={(tabId) => setFilter(tabId as FilterType)}
          variant="contained"
          showCount
          className="mb-0 [&_button]:h-12"
        />

        {filteredNotifications.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D]">
            <Button
              variant="ghost"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 h-auto"
            >
              {isAllSelected ? '전체 해제' : '전체 선택'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium h-auto ${
                selectedIds.size === 0
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              선택 삭제
              {selectedIds.size > 0 && (
                <span className="text-xs">({selectedIds.size})</span>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium h-auto ml-auto ${
                unreadCount === 0
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              전체 읽음
            </Button>
          </div>
        )}

        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-black/5 dark:divide-white/10 overflow-hidden md:rounded-b-lg">
            {paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkAsRead}
                isSelected={selectedIds.has(notification.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-[13px] font-medium">
              {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {filter === 'unread'
                ? '모든 알림을 확인했습니다'
                : '새로운 소식이 있으면 알려드립니다'}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            mode="button"
            maxButtons={5}
          />
        </div>
      )}
    </>
  );
}

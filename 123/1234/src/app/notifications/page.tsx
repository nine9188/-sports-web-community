'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { getNotifications } from '@/domains/notifications/actions/get';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/domains/notifications/actions/read';
import { deleteNotifications } from '@/domains/notifications/actions/delete';
import { Notification, NotificationType } from '@/domains/notifications/types/notification';
import NotificationItem from '@/domains/notifications/components/NotificationItem';
import { shouldShowNotification } from '@/domains/notifications/utils/filterNotifications';

type FilterType = 'all' | 'unread';
type TypeFilter = 'all' | NotificationType;

const notificationTypeLabels: Record<TypeFilter, string> = {
  all: '전체 타입',
  comment: '댓글',
  reply: '답글',
  post_like: '게시글 좋아요',
  comment_like: '댓글 좋아요',
  level_up: '레벨업',
  report_result: '신고 결과',
  admin_notice: '공지사항'
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await getNotifications(100); // 최대 100개 조회
      if (response.success && response.notifications) {
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 알림 읽음 처리
  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id);
    if (result.success) {
      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    // 읽음 처리 확인
    const confirmMessage = `${unreadCount}개의 읽지 않은 알림을 모두 읽음 처리하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  // 선택 토글
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    // 삭제 확인
    const confirmMessage = `선택한 ${selectedIds.size}개의 알림을 삭제하시겠습니까?\n삭제된 알림은 복구할 수 없습니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // 삭제 API 호출
    const result = await deleteNotifications(Array.from(selectedIds));

    if (result.success) {
      // 로컬 상태에서 제거
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());

      // 읽지 않은 알림 수 재계산
      const newUnreadCount = notifications.filter(n => !n.is_read && !selectedIds.has(n.id)).length;
      setUnreadCount(newUnreadCount);
    } else {
      // 삭제 실패 시 에러 메시지 표시
      alert(result.error || '알림 삭제에 실패했습니다.');
    }
  };

  // 필터링된 알림 목록
  const filteredNotifications = notifications.filter(notification => {
    // 읽은 알림 이틀 후 자동 숨김
    if (!shouldShowNotification(notification)) {
      return false;
    }

    // 읽음/안읽음 필터
    if (filter === 'unread' && notification.is_read) {
      return false;
    }
    // 타입 필터
    if (typeFilter !== 'all' && notification.type !== typeFilter) {
      return false;
    }
    return true;
  });

  // 전체 선택 여부
  const isAllSelected = filteredNotifications.length > 0 && selectedIds.size === filteredNotifications.length;

  return (
    <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg">
      {/* 헤더 */}
      <div className="h-12 px-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0]" />
          <h1 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">알림</h1>
          {unreadCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {unreadCount}개의 읽지 않은 알림
            </span>
          )}
        </div>

        {/* 타입 필터 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
          >
            {notificationTypeLabels[typeFilter]}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isDropdownOpen && (
            <>
              {/* 백드롭 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* 드롭다운 메뉴 */}
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                {(Object.keys(notificationTypeLabels) as TypeFilter[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTypeFilter(type);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors outline-none focus:outline-none ${
                      typeFilter === type
                        ? 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
                    }`}
                  >
                    {notificationTypeLabels[type]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex border-b border-black/5 dark:border-white/10">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 h-12 px-4 text-sm font-medium transition-colors outline-none focus:outline-none ${
            filter === 'all'
              ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border-b-2 border-slate-800 dark:border-white'
              : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
          }`}
        >
          전체
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({notifications.length})
          </span>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 h-12 px-4 text-sm font-medium transition-colors outline-none focus:outline-none ${
            filter === 'unread'
              ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border-b-2 border-slate-800 dark:border-white'
              : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
          }`}
        >
          안 읽음
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-gray-900 dark:bg-[#F0F0F0] text-white dark:text-gray-900 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 액션 버튼 */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
          >
            {isAllSelected ? '전체 해제' : '전체 선택'}
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors outline-none focus:outline-none ${
              selectedIds.size === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            선택 삭제
            {selectedIds.size > 0 && (
              <span className="text-xs">
                ({selectedIds.size})
              </span>
            )}
          </button>

          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors outline-none focus:outline-none ml-auto ${
              unreadCount === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            전체 읽음
          </button>
        </div>
      )}

      {/* 알림 목록 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-900 dark:text-[#F0F0F0] animate-spin mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            알림을 불러오는 중...
          </p>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {filteredNotifications.map((notification) => (
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
          <p className="text-sm font-medium">
            {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {filter === 'unread'
              ? '모든 알림을 확인했습니다'
              : '새로운 소식이 있으면 알려드릴게요'}
          </p>
        </div>
      )}
    </div>
  );
}

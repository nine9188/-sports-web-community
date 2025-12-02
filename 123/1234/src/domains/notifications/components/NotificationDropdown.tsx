'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Notification } from '../types/notification';
import NotificationItem from './NotificationItem';
import { filterOldReadNotifications } from '../utils/filterNotifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onClose,
  isLoading = false
}: NotificationDropdownProps) {
  // 읽은 알림 이틀 후 자동 숨김
  const visibleNotifications = useMemo(() =>
    filterOldReadNotifications(notifications),
    [notifications]
  );

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-black/7 dark:border-0 overflow-hidden z-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
        <h3 className="font-bold text-sm text-gray-900 dark:text-[#F0F0F0]">
          알림 {unreadCount > 0 && <span className="text-gray-500 dark:text-gray-400">({unreadCount})</span>}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-2 py-1 rounded transition-colors"
          >
            전체 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-[#F0F0F0] rounded-full animate-spin" />
          </div>
        ) : visibleNotifications.length > 0 ? (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {visibleNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onMarkRead}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">새로운 알림이 없습니다</p>
          </div>
        )}
      </div>

      {/* 푸터 - 전체 보기 링크 */}
      {visibleNotifications.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/10">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block px-4 py-3 text-center text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          >
            전체 알림 보기
          </Link>
        </div>
      )}
    </div>
  );
}





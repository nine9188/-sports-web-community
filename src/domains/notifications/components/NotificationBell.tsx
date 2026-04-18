'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Notification } from '../types/notification';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../actions';
import NotificationDropdown from './NotificationDropdown';
import MobileNotificationModal from './MobileNotificationModal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/shared/components/ui';
import { useNotifications, useNotificationCache } from '../hooks/useNotificationQueries';

interface NotificationBellProps {
  userId: string | null;
  initialUnreadCount?: number;
}

export default function NotificationBell({ userId, initialUnreadCount = 0 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowser();

  const isMobile = useMediaQuery('(max-width: 767px)');

  const {
    data,
    isLoading,
    refetch,
  } = useNotifications(20, { enabled: !!userId });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? initialUnreadCount;

  const { addNotification, markAsRead, markAllAsRead } = useNotificationCache();

  // ref로 최신 콜백을 안정적으로 참조 (useEffect deps에서 제외)
  const callbacksRef = useRef({ addNotification, refetch });
  callbacksRef.current = { addNotification, refetch };

  // 드롭다운 외부 클릭 감지 (데스크톱에서만)
  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // 모달/드롭다운 열릴 때 알림 새로고침
  useEffect(() => {
    if (isOpen && userId) {
      refetch();
    }
  }, [isOpen, userId, refetch]);

  // 실시간 알림: Broadcast 채널 구독 (postgres_changes 대신 — RLS 바인딩 불필요)
  useEffect(() => {
    if (!userId || !supabase) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'broadcast',
        { event: 'new_notification' },
        (payload: { payload: Notification }) => {
          callbacksRef.current.addNotification(payload.payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // 단일 알림 읽음 처리
  const handleMarkRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      markAsRead(notificationId);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      markAllAsRead();
    }
  };

  // 모달/드롭다운 닫기
  const handleClose = () => {
    setIsOpen(false);
  };

  // 로그인하지 않은 경우 표시 안 함
  if (!userId) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* 벨 아이콘 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="알림"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>

          {/* 뱃지 */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {/* 데스크톱: 드롭다운 */}
        {isOpen && !isMobile && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={handleMarkAllRead}
            onMarkRead={handleMarkRead}
            onClose={handleClose}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* 모바일: 전체 화면 모달 */}
      <MobileNotificationModal
        isOpen={isOpen && isMobile}
        onClose={handleClose}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        isLoading={isLoading}
      />
    </>
  );
}

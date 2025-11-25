'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/shared/api/supabase';
import { Notification } from '../types/notification';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../actions';
import NotificationDropdown from './NotificationDropdown';
import MobileNotificationModal from './MobileNotificationModal';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface NotificationBellProps {
  userId: string | null;
  initialUnreadCount?: number;
}

export default function NotificationBell({ userId, initialUnreadCount = 0 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  // 모바일 여부 감지 (md breakpoint: 768px)
  const isMobile = useMediaQuery('(max-width: 767px)');

  // 드롭다운 외부 클릭 감지 (데스크톱에서만)
  useEffect(() => {
    if (isMobile) return; // 모바일에서는 외부 클릭 감지 비활성화
    
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

  // 알림 목록 로드
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getNotifications(20);
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('알림 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 모달/드롭다운 열릴 때 알림 로드
  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId, loadNotifications]);

  // 실시간 알림 구독
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // 새 알림이 들어오면 카운트 증가
          setUnreadCount(prev => prev + 1);
          
          // 모달/드롭다운이 열려있으면 목록도 업데이트
          if (isOpen) {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, isOpen]);

  // 단일 알림 읽음 처리
  const handleMarkRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // 전체 읽음 처리
  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  // 모달/드롭다운 닫기
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 로그인하지 않은 경우 표시 안 함
  if (!userId) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* 벨 아이콘 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#333333] rounded-full transition-colors"
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
        </button>

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


'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Notification } from '../types/notification';
import NotificationItem from './NotificationItem';

interface MobileNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  isLoading?: boolean;
}

export default function MobileNotificationModal({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  isLoading = false
}: MobileNotificationModalProps) {
  // SSR 보호: 클라이언트 마운트 후에만 포털 사용
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1D1D1D] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between p-4 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">
            알림 {unreadCount > 0 && <span className="text-blue-500">({unreadCount})</span>}
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 transition-colors"
              >
                전체 읽음
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 알림 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-white/10">
              {notifications.map((notification) => (
                <div key={notification.id} onClick={onClose}>
                  <NotificationItem
                    notification={notification}
                    onRead={onMarkRead}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm font-medium">새로운 알림이 없습니다</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                새로운 소식이 있으면 알려드릴게요
              </p>
            </div>
          )}
        </div>

        {/* 푸터 - 전체 보기 링크 */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-100 dark:border-white/10 p-4">
            <Link
              href="/notifications"
              onClick={onClose}
              className="block w-full py-3 text-center text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 bg-gray-50 dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-colors"
            >
              전체 알림 보기
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}




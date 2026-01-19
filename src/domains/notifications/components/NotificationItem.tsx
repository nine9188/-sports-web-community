'use client';

import React from 'react';
import Link from 'next/link';
import { Notification } from '../types/notification';
import { formatDate } from '@/shared/utils/date';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function NotificationItem({ notification, onRead, isSelected, onToggleSelect }: NotificationItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // 체크박스 클릭이 아닌 경우에만 읽음 처리
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('input[type="checkbox"]')) {
      return;
    }

    if (!notification.is_read && onRead) {
      onRead(notification.id);
    }
  };

  const handleCheckboxChange = () => {
    if (onToggleSelect) {
      onToggleSelect(notification.id);
    }
  };

  // 알림 타입에 따른 아이콘
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'comment':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'post_like':
      case 'comment_like':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        );
      case 'level_up':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'welcome':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'hot_post':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        );
      case 'profile_update':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'suspension':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'report_result':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  // 알림 내용 부분 (링크가 있으면 Link로 감싸짐)
  const notificationContent = (
    <div className="flex items-center gap-3 flex-1 py-3 pr-3">
      {/* 타입 아이콘 */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center text-gray-500 dark:text-gray-400">
          {getTypeIcon()}
        </div>
      </div>

      {/* 알림 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-[#F0F0F0] line-clamp-2">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDate(notification.created_at)}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`flex items-center transition-colors relative ${
        !notification.is_read ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''
      } ${isSelected ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}
    >
      {/* 왼쪽 세로 바 (안읽은 알림 표시) */}
      {!notification.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}

      {/* 체크박스 영역 - 링크와 분리 */}
      {onToggleSelect && (
        <div
          className="flex-shrink-0 w-12 flex items-center justify-center self-stretch cursor-pointer border-r border-black/5 dark:border-white/10 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCheckboxChange();
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:ring-gray-900 dark:focus:ring-[#F0F0F0] cursor-pointer"
          />
        </div>
      )}

      {/* 알림 내용 영역 - 링크 적용 */}
      {notification.link ? (
        <Link
          href={notification.link}
          className={`flex-1 cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${!onToggleSelect ? 'pl-3' : 'pl-2'}`}
          onClick={handleClick}
        >
          {notificationContent}
        </Link>
      ) : (
        <div className={`flex-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${!onToggleSelect ? 'pl-3' : 'pl-2'}`} onClick={handleClick}>
          {notificationContent}
        </div>
      )}
    </div>
  );
}





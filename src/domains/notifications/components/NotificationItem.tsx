'use client';

import React from 'react';
import Link from 'next/link';
import { Notification } from '../types/notification';
import UserIcon from '@/shared/components/UserIcon';
import { formatDate } from '@/shared/utils/date';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read && onRead) {
      onRead(notification.id);
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
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const content = (
    <div 
      className={`flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
      onClick={handleClick}
    >
      {/* 읽음 표시 점 */}
      <div className="flex-shrink-0 pt-1.5">
        {!notification.is_read ? (
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* 액터 아이콘 또는 타입 아이콘 */}
      <div className="flex-shrink-0">
        {notification.actor ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <UserIcon
              iconUrl={notification.actor.icon_url || null}
              level={notification.actor.level || 1}
              size={32}
              alt={notification.actor.nickname || '사용자'}
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#333333] flex items-center justify-center text-gray-500 dark:text-gray-400">
            {getTypeIcon()}
          </div>
        )}
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

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}




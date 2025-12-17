'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export function ChatFloatingButton({ onClick, isOpen, unreadCount = 0 }: ChatFloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out',
          'hover:scale-110 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          'bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A]',
          'active:scale-95'
        )}
        aria-label={isOpen ? '채팅 닫기' : '채팅 열기'}
      >
        {/* Icon */}
        <div className={cn(
          'transition-transform duration-300',
          isOpen ? 'rotate-180' : 'rotate-0'
        )}>
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Unread count badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Ripple effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-slate-400 dark:bg-slate-500 animate-ping opacity-20" />
        )}

        {/* Hover tooltip */}
        {isHovered && !isOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
            고객센터 문의
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800 dark:border-t-gray-700" />
          </div>
        )}
      </button>
    </div>
  );
}
'use client';

import { ChevronLeft, List, MessageCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatHeaderProps {
  currentView: 'chat' | 'conversations';
  onViewChange: (view: 'chat' | 'conversations') => void;
  conversationTitle?: string;
  canGoBack?: boolean;
  onNewConversation?: () => void;
}

export function ChatHeader({ 
  currentView, 
  onViewChange, 
  conversationTitle,
  canGoBack = true,
  onNewConversation 
}: ChatHeaderProps) {
  const handleBackClick = () => {
    if (currentView === 'chat' && canGoBack) {
      onViewChange('conversations');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        {currentView === 'chat' && canGoBack && (
          <button
            onClick={handleBackClick}
            className="p-1 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            aria-label="대화 목록으로 돌아가기"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        
        <div className="flex items-center space-x-2">
          {currentView === 'conversations' ? (
            <>
              <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">대화 목록</h2>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] truncate">
                {conversationTitle || '고객센터'}
              </h2>
            </>
          )}
        </div>
      </div>

      {/* Right Section - 새 대화 버튼 제거됨 */}
      <div className="flex items-center space-x-2">
      </div>
    </div>
  );
}
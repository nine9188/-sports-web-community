'use client';

import { formatMessageTime } from '../utils';
import { ChatConversation } from '../types';
import { MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui';

interface ChatConversationListProps {
  conversations: ChatConversation[];
  onConversationSelect: (conversationId: string) => void;
  activeConversationId?: string;
  isLoading?: boolean;
  onNewConversation?: () => void;
  getUnreadCount?: (conversationId: string) => number;
}

export function ChatConversationList({
  conversations,
  onConversationSelect,
  activeConversationId,
  isLoading = false,
  onNewConversation,
  getUnreadCount
}: ChatConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 rounded-none bg-[#F5F5F5] dark:bg-[#262626]">
                <div className="w-10 h-10 bg-[#EAEAEA] dark:bg-[#333333] rounded-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded-none w-3/4" />
                  <div className="h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded-none w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              대화 내역이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              새 대화를 시작해보세요
            </p>
          </div>
        </div>
        
        {/* 새 대화 버튼 */}
        {onNewConversation && (
          <div className="flex-shrink-0 p-4 border-t border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
            <Button
              variant="primary"
              onClick={onNewConversation}
              className="w-full py-3"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>새 대화 시작</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {conversations.map((conversation) => {
            const unreadCount = getUnreadCount ? getUnreadCount(conversation.id) : 0;

            return (
              <Button
                key={conversation.id}
                variant="ghost"
                onClick={() => onConversationSelect(conversation.id)}
                className={cn(
                  'w-full p-4 text-left justify-start rounded-none h-auto',
                  activeConversationId === conversation.id && 'bg-[#EAEAEA] dark:bg-[#333333] border-r-2 border-[#262626] dark:border-[#F0F0F0]'
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Conversation Icon with Unread Badge */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      conversation.status === 'active' ? 'bg-[#262626] dark:bg-[#3F3F3F]' : 'bg-[#F5F5F5] dark:bg-[#262626]'
                    )}>
                      <MessageCircle className={cn(
                        'w-5 h-5',
                        conversation.status === 'active' ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      )} />
                    </div>
                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={cn(
                        'text-sm truncate',
                        unreadCount > 0 ? 'font-bold text-gray-900 dark:text-[#F0F0F0]' : 'font-medium text-gray-900 dark:text-[#F0F0F0]'
                      )}>
                        {conversation.title}
                      </h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300 ml-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatMessageTime(conversation.last_message_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-none text-xs font-medium',
                        conversation.status === 'active' ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white' :
                        conversation.status === 'completed' ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-800 dark:text-[#F0F0F0]' :
                        'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
                      )}>
                        {conversation.status === 'active' ? '진행중' :
                         conversation.status === 'completed' ? '완료' : '종료'}
                      </span>
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 새 대화 버튼 */}
      {onNewConversation && (
        <div className="flex-shrink-0 p-4 border-t border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <Button
            variant="primary"
            onClick={onNewConversation}
            className="w-full py-3"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            <span>새 대화 시작</span>
          </Button>
        </div>
      )}
    </div>
  );
}
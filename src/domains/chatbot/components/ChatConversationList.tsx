'use client';

import { formatMessageTime } from '../utils';
import { ChatConversation } from '../types';
import { MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatConversationListProps {
  conversations: ChatConversation[];
  onConversationSelect: (conversationId: string) => void;
  activeConversationId?: string;
  isLoading?: boolean;
  onNewConversation?: () => void;
}

export function ChatConversationList({ 
  conversations, 
  onConversationSelect, 
  activeConversationId,
  isLoading = false,
  onNewConversation 
}: ChatConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#262626]">
                <div className="w-10 h-10 bg-[#EAEAEA] dark:bg-[#333333] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-3/4" />
                  <div className="h-3 bg-[#EAEAEA] dark:bg-[#333333] rounded w-1/2" />
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
            <button
              onClick={onNewConversation}
              className={cn(
                'w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                'bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A]',
                'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                'flex items-center justify-center space-x-2'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              <span>새 대화 시작</span>
            </button>
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
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
              className={cn(
                'w-full p-4 text-left hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors',
                'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333]',
                activeConversationId === conversation.id && 'bg-[#EAEAEA] dark:bg-[#333333] border-r-2 border-gray-700 dark:border-gray-300'
              )}
            >
              <div className="flex items-start space-x-3">
                {/* Conversation Icon */}
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  conversation.status === 'active' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-[#F5F5F5] dark:bg-[#262626]'
                )}>
                  <MessageCircle className={cn(
                    'w-5 h-5',
                    conversation.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  )} />
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                      {conversation.title}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300 ml-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatMessageTime(conversation.last_message_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      conversation.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                      conversation.status === 'completed' ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-800 dark:text-[#F0F0F0]' :
                      'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
                    )}>
                      {conversation.status === 'active' ? '진행중' :
                       conversation.status === 'completed' ? '완료' : '종료'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 새 대화 버튼 */}
      {onNewConversation && (
        <div className="flex-shrink-0 p-4 border-t border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <button
            onClick={onNewConversation}
            className={cn(
              'w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors',
              'bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A]',
              'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
              'flex items-center justify-center space-x-2'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>새 대화 시작</span>
          </button>
        </div>
      )}
    </div>
  );
}
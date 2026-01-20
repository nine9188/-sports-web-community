'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatTypingBubble } from './ChatTypingBubble';
import { scrollToBottom } from '../utils';
import Spinner from '@/shared/components/Spinner';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  isLoading?: boolean;
  onMessageRead?: (messageId: string) => void;
  onFormSubmit?: (formData: Record<string, any>) => void;
  onChipClick?: (chip: any) => void;
  isFormSubmitting?: boolean;
}

export function ChatMessageList({
  messages,
  isTyping = false,
  isLoading = false,
  onMessageRead,
  onFormSubmit,
  onChipClick,
  isFormSubmitting = false
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevFirstMessageIdRef = useRef<string | null>(null);

  // 대화 전환 또는 초기 로드 시 스크롤
  const firstMessageId = messages[0]?.id || null;

  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      // 새로운 대화가 열렸을 때 (첫 메시지 ID가 변경됨)
      if (prevFirstMessageIdRef.current !== firstMessageId) {
        scrollToBottom(containerRef.current);
        prevFirstMessageIdRef.current = firstMessageId;
        prevMessageCountRef.current = messages.length;
      }
    }
  }, [firstMessageId, messages.length]);

  // 새 메시지 추가 또는 타이핑 시 스크롤
  useEffect(() => {
    if (containerRef.current && prevFirstMessageIdRef.current === firstMessageId) {
      const shouldScroll = messages.length > prevMessageCountRef.current || isTyping;

      if (shouldScroll) {
        scrollToBottom(containerRef.current);
      }

      prevMessageCountRef.current = messages.length;
    }
  }, [messages.length, isTyping, firstMessageId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onMessageRead) return;

    const handleScroll = () => {
      const unreadMessages = messages.filter(msg => !msg.is_read && msg.type === 'bot');
      
      unreadMessages.forEach(message => {
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          if (rect.top >= containerRect.top && rect.bottom <= containerRect.bottom) {
            onMessageRead(message.id);
          }
        }
      });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, onMessageRead]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-700 dark:text-gray-300">
            <p className="text-sm">메시지가 없습니다</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.id} id={`message-${message.id}`}>
              <ChatMessageBubble
                message={message}
                showTimestamp={
                  index === 0 ||
                  index === messages.length - 1 ||
                  (index > 0 && new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000)
                }
                onFormSubmit={onFormSubmit}
                onChipClick={onChipClick}
                isFormSubmitting={message.type === 'form' ? isFormSubmitting : false}
              />
            </div>
          ))}
          
          {isTyping && <ChatTypingBubble />}
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
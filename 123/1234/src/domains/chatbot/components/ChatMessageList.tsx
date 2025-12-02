'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatTypingBubble } from './ChatTypingBubble';
import { scrollToBottom } from '../utils';

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

  useEffect(() => {
    if (containerRef.current) {
      scrollToBottom(containerRef.current);
    }
  }, [messages, isTyping]);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
          <div className="text-center text-gray-500">
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
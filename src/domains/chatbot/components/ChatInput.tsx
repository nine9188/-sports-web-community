'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "메시지를 입력하세요..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment Button (placeholder) */}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex-shrink-0 p-2 rounded-full transition-colors',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="파일 첨부"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'resize-none overflow-hidden',
              'placeholder-gray-500',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
            )}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={cn(
            'flex-shrink-0 p-3 rounded-full transition-all duration-200',
            'bg-blue-600 text-white hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600',
            'active:scale-95 transform',
            message.trim() && !disabled && 'hover:scale-105'
          )}
          aria-label="메시지 전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
      
      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Enter로 전송, Shift+Enter로 줄바꿈
      </div>
    </div>
  );
}
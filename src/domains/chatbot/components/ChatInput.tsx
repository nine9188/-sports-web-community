'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui';

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
    <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white dark:bg-[#1D1D1D]">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Attachment Button (placeholder) */}
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="파일 첨부"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 min-w-0 px-3 h-10 rounded-none border border-black/7 dark:border-white/10',
            'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0]',
            'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'focus:bg-[#EAEAEA] dark:focus:bg-[#333333]',
            'resize-none overflow-hidden transition-colors leading-10',
            'placeholder-gray-500 dark:placeholder-gray-400',
            disabled && 'opacity-50 cursor-not-allowed bg-[#F5F5F5] dark:bg-[#262626]'
          )}
          style={{ maxHeight: '120px' }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md',
            'bg-[#262626] dark:bg-[#3F3F3F] text-white',
            'hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-all duration-200',
            'active:scale-95',
            (disabled || !message.trim()) && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="메시지 전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
      
      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 text-center">
        Enter로 전송, Shift+Enter로 줄바꿈
      </div>
    </div>
  );
}

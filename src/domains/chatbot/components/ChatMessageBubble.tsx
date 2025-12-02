'use client';

import { ChatMessage } from '../types';
import { formatMessageTime } from '../utils';
import { Check, CheckCheck, Clock, User, Bot } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  showReadStatus?: boolean;
  onFormSubmit?: (formData: Record<string, any>) => void;
  onChipClick?: (chip: any) => void;
  isFormSubmitting?: boolean;
}

export function ChatMessageBubble({ 
  message, 
  showTimestamp = false,
  showReadStatus = true,
  onFormSubmit,
  onChipClick,
  isFormSubmitting = false 
}: ChatMessageBubbleProps) {
  const isUser = message.type === 'user';
  const isBot = message.type === 'bot';
  const isSystem = message.type === 'system';
  const isForm = message.type === 'form';
  const isChips = message.type === 'chips';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border">
          {message.content}
        </div>
      </div>
    );
  }

  if (isChips && message.form_data) {
    const { ChatChipButtons, SingleChipButton } = require('./ChatChipButtons');
    const isCompletion = message.form_data.showCompletion;
    
    return (
      <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-left-2 duration-300">
        {/* Bot Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-600" />
        </div>

        {/* Chips Content */}
        <div className="max-w-xs lg:max-w-md">
          {isCompletion ? (
            <div className="flex space-x-2 justify-center">
              <SingleChipButton
                label="괜찮아요"
                onClick={() => onChipClick && onChipClick({ label: '괜찮아요' })}
                disabled={false}
              />
              <SingleChipButton
                label="네 다른문의 할게요"
                onClick={() => onChipClick && onChipClick({ label: '네 다른문의 할게요' })}
                disabled={false}
                variant="primary"
              />
            </div>
          ) : (
            <ChatChipButtons
              onChipClick={onChipClick || (() => {})}
              disabled={false}
            />
          )}
        </div>
      </div>
    );
  }

  if (isForm && message.form_data) {
    // Import ChatFormRenderer dynamically to avoid circular dependency
    const { ChatFormRenderer } = require('./ChatFormRenderer');
    
    return (
      <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-left-2 duration-300">
        {/* Bot Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-600" />
        </div>

        {/* Form Content */}
        <div className="max-w-xs lg:max-w-md">
          <ChatFormRenderer
            formConfig={message.form_data}
            onSubmit={onFormSubmit || (() => {})}
            isSubmitting={isFormSubmitting}
            messageSubmitted={message.is_submitted}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start space-x-3 animate-in fade-in-0 duration-300',
      isUser ? 'flex-row-reverse space-x-reverse slide-in-from-right-2' : 'slide-in-from-left-2'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-blue-600' : 'bg-gray-100'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex flex-col space-y-1',
        isUser ? 'items-end' : 'items-start',
        'max-w-xs lg:max-w-md'
      )}>
        {/* Message Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-sm',
          isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200'
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          
          {/* Form Data Display (if exists) */}
          {message.form_data && (
            <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
              <div className="text-xs opacity-75">
                제출된 정보
              </div>
            </div>
          )}
        </div>

        {/* Message Info */}
        <div className={cn(
          'flex items-center space-x-2 text-xs text-gray-500',
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        )}>
          {showTimestamp && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatMessageTime(message.created_at)}</span>
            </div>
          )}
          
          {/* Read Status (only for user messages) */}
          {isUser && showReadStatus && (
            <div className="flex items-center">
              {message.is_read ? (
                <CheckCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <Check className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
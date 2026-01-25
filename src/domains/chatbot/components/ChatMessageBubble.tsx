'use client';

import { ChatMessage } from '../types';
import { formatMessageTime } from '../utils';
import { Check, CheckCheck, Clock, User, Bot } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic imports for better code splitting
const ChatChipButtons = dynamic(() => import('./ChatChipButtons').then(m => ({ default: m.ChatChipButtons })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-[#F5F5F5] dark:bg-[#262626] h-10 rounded-none" />
});

const SingleChipButton = dynamic(() => import('./ChatChipButtons').then(m => ({ default: m.SingleChipButton })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-[#F5F5F5] dark:bg-[#262626] h-10 w-24 rounded-none" />
});

const ChatFormRenderer = dynamic(() => import('./ChatFormRenderer').then(m => ({ default: m.ChatFormRenderer })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-[#F5F5F5] dark:bg-[#262626] h-40 rounded-none" />
});

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
        <div className="px-3 py-1 bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300 text-xs rounded-none border border-black/5 dark:border-white/10">
          {message.content}
        </div>
      </div>
    );
  }

  if (isChips && message.form_data) {
    const isCompletion = message.form_data.showCompletion;
    const chipLabels = message.form_data.chips as string[] | undefined;
    const isClicked = message.form_data.is_clicked === true;
    const selectedLabel = message.form_data.selected_label as string | undefined;

    return (
      <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-left-2 duration-300">
        {/* Bot Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </div>

        {/* Chips Content */}
        <div className="max-w-xs lg:max-w-md w-full">
          <Suspense fallback={<div className="animate-pulse bg-[#F5F5F5] dark:bg-[#262626] h-10 rounded-none" />}>
            {isCompletion ? (
              <div className="flex space-x-2">
                <SingleChipButton
                  label="괜찮아요"
                  onClick={() => onChipClick && onChipClick({ label: '괜찮아요' })}
                  disabled={isClicked}
                  isSelected={selectedLabel === '괜찮아요'}
                />
                <SingleChipButton
                  label="네 다른문의 할게요"
                  onClick={() => onChipClick && onChipClick({ label: '네 다른문의 할게요' })}
                  disabled={isClicked}
                  isSelected={selectedLabel === '네 다른문의 할게요'}
                />
              </div>
            ) : chipLabels && chipLabels.length > 0 ? (
              <ChatChipButtons
                onChipClick={onChipClick || (() => {})}
                disabled={isClicked}
                filterLabels={chipLabels}
                selectedLabel={selectedLabel}
              />
            ) : (
              <ChatChipButtons
                onChipClick={onChipClick || (() => {})}
                disabled={isClicked}
                selectedLabel={selectedLabel}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  if (isForm && message.form_data) {
    return (
      <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-left-2 duration-300">
        {/* Bot Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </div>

        {/* Form Content */}
        <div className="max-w-xs lg:max-w-md">
          <Suspense fallback={<div className="animate-pulse bg-[#F5F5F5] dark:bg-[#262626] h-40 rounded-none" />}>
            <ChatFormRenderer
              formConfig={message.form_data}
              onSubmit={onFormSubmit || (() => {})}
              isSubmitting={isFormSubmitting}
              messageSubmitted={message.form_data?.is_submitted === true}
              initialData={message.form_data?.submitted_data}
            />
          </Suspense>
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
        isUser ? 'bg-[#262626] dark:bg-[#3F3F3F]' : 'bg-[#F5F5F5] dark:bg-[#262626]'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />
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
          'px-4 py-3 rounded-none shadow-sm border',
          isUser
            ? 'bg-[#262626] dark:bg-[#3F3F3F] text-white border-black/7 dark:border-white/0'
            : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] border-black/7 dark:border-white/0'
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
          'flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300',
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
                <CheckCheck className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              ) : (
                <Check className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
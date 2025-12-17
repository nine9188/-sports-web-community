'use client';
import { cn } from '@/shared/utils/cn';

export function ChatTypingBubble() {
  return (
    <div className="flex items-start space-x-3 animate-in fade-in-0 slide-in-from-left-2 duration-300">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-gray-700 dark:bg-gray-300" />
      </div>

      {/* Typing Bubble */}
      <div className={cn(
        'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-md',
        'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]',
        'shadow-sm border border-black/7 dark:border-white/0'
      )}>
        <div className="flex items-center space-x-1">
          {/* Animated Dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ChatModal({ isOpen, onClose, children }: ChatModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end justify-end pointer-events-none">
      {/* Modal Container - only the modal itself receives pointer events */}
      <div
        ref={modalRef}
        className={cn(
          'pointer-events-auto',
          'relative bg-white dark:bg-[#1D1D1D] rounded-t-lg md:rounded-lg shadow-2xl',
          'transition-all duration-300 ease-out',
          'w-full h-[85vh] md:w-96 md:h-[600px]',
          'md:m-6 md:mb-20',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-bottom-full md:slide-in-from-right-full',
          'border border-black/7 dark:border-white/0'
        )}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full"
          aria-label="채팅 닫기"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
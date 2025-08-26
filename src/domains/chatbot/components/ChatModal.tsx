'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { ChatState } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatState: ChatState;
  children: React.ReactNode;
}

export function ChatModal({ isOpen, onClose, chatState, children }: ChatModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className={cn(
          'relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl',
          'transition-all duration-300 ease-out',
          'w-full h-[85vh] md:w-96 md:h-[600px]',
          'md:m-6 md:mb-20',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-bottom-full md:slide-in-from-right-full',
          'border border-gray-200'
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="채팅 닫기"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
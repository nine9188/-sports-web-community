'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ChatModal({ isOpen, onClose, children }: ChatModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [hasEntered, setHasEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 스크롤락을 걸지 않아 레이아웃 변화(스크롤바 사라짐)를 방지

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Enter/Exit 애니메이션 제어: 닫힐 때도 잠시 유지하여 slide-out 실행
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      // 초기 상태를 강제로 translate-y-full/opacity-0로 렌더링 후 다음 프레임에 0/1으로 전환
      setHasEntered(false);
      requestAnimationFrame(() => {
        void modalRef.current?.getBoundingClientRect();
        requestAnimationFrame(() => setHasEntered(true));
      });
      return;
    }
    if (isVisible) {
      // exit 전환: 슬라이드는 즉시, 불투명도는 약간 지연 후 감소
      setIsClosing(true);
      setHasEntered(false);
      const t = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      {/* Backdrop (transparent) */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className={cn(
          'relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl',
          'transition-transform duration-300 ease-out will-change-transform',
          'w-full h-[85vh] md:w-96 md:h-[600px]',
          'mb-24 md:m-6 md:mb-24',
          'flex flex-col overflow-hidden',
          // y축(위/아래) 이동만 사용 + 페이드 인/아웃
          hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
          'border border-gray-200'
        )}
        style={{
          transition: `transform 300ms ease-out, opacity 300ms ease-out ${isClosing ? 150 : 0}ms`
        }}
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
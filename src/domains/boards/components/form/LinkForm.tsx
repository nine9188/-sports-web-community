'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui';

interface LinkFormProps {
  onCancel: () => void;
  onLinkAdd: (url: string, text?: string) => void;
  isOpen: boolean;
}

export default function LinkForm({ 
  onCancel, 
  onLinkAdd,
  isOpen
}: LinkFormProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // 드롭다운이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setText('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!url) return;
    // text가 비어있으면 undefined로 전달
    onLinkAdd(url, text || undefined);
  };

  if (!isOpen) return null;

  return (
      <div
        ref={dropdownRef}
        className="bg-white dark:bg-[#1D1D1D] border-x border-black/7 dark:border-white/10 overflow-hidden w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">링크 추가</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                id="linkUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                placeholder="URL을 입력하세요"
              />
            </div>

            <div>
              <input
                type="text"
                id="linkText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 text-xs bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors"
                placeholder="표시할 텍스트 (선택사항)"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!url}
                className="text-xs"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
} 
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/ui/button';

interface LinkFormProps {
  onCancel: () => void;
  onLinkAdd: (url: string, text: string) => void;
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
    // 데이터 속성 추가하여 일반 링크 구분
    onLinkAdd(url, text);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-10 bg-white rounded-lg shadow-lg border w-80 p-4 mt-2"
    >
      <div className="h-[124px]">
        <div className="border-b mb-4">
          <div className="flex">
            <button
              type="button"
              className="px-4 py-1 text-xs border-b-2 border-blue-500 text-blue-600 font-medium"
            >
              링크 추가
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <input
              type="text"
              id="linkUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              placeholder="URL을 입력하세요"
            />
          </div>
          
          <div>
            <input
              type="text"
              id="linkText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              placeholder="표시할 텍스트 (선택사항)"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs py-1 px-2 h-6"
        >
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!url}
          className="text-xs py-1 px-2 h-6"
        >
          확인
        </Button>
      </div>
    </div>
  );
} 
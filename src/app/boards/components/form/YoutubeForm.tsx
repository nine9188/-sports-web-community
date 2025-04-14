'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/ui/button';

interface YoutubeFormProps {
  onCancel: () => void;
  onYoutubeAdd: (url: string, caption?: string) => void;
  isOpen: boolean;
}

export default function YoutubeForm({ 
  onCancel, 
  onYoutubeAdd,
  isOpen
}: YoutubeFormProps) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
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
      setCaption('');
      setIsValidUrl(false);
    }
  }, [isOpen]);

  // URL 유효성 검사
  const validateYoutubeUrl = (input: string) => {
    // 유튜브 URL 패턴 검사 (유튜브 표준 URL 및 단축 URL 모두 포함)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
    return youtubeRegex.test(input);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    setIsValidUrl(validateYoutubeUrl(input));
  };

  const handleSubmit = () => {
    if (!url || !isValidUrl) return;
    // 캡션과 함께 유튜브 URL 전달
    onYoutubeAdd(url, caption);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-10 bg-white rounded-lg shadow-lg border w-80 p-4 mt-2"
    >
      <div className="h-auto">
        <div className="border-b mb-4">
          <div className="flex">
            <button
              type="button"
              className="px-4 py-1 text-xs border-b-2 border-blue-500 text-blue-600 font-medium"
            >
              유튜브 추가
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <input
              type="text"
              id="youtubeUrl"
              value={url}
              onChange={handleUrlChange}
              className={`w-full border ${isValidUrl ? 'border-green-500' : 'border-gray-300'} rounded-md px-3 py-2 text-xs`}
              placeholder="YouTube 동영상 URL을 입력하세요"
            />
          </div>
          
          <div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              placeholder="동영상 설명(선택사항)"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <p>예: https://www.youtube.com/watch?v=XXXXXXXXXXX</p>
            <p>또는: https://youtu.be/XXXXXXXXXXX</p>
          </div>
          
          {!isValidUrl && url && (
            <div className="text-xs text-red-500">
              유효한 YouTube URL을 입력해주세요
            </div>
          )}
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
          disabled={!url || !isValidUrl}
          className="text-xs py-1 px-2 h-6"
        >
          확인
        </Button>
      </div>
    </div>
  );
} 
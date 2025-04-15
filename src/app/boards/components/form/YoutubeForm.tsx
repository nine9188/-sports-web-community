'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/ui/button';

interface YoutubeFormProps {
  onCancel: () => void;
  onYoutubeAdd: (url: string, caption?: string) => void;
  isOpen: boolean;
}

// YouTube ID를 추출하는 정규식 함수 - YoutubeExtension과 동일한 로직 사용
const getYoutubeId = (url: string): string | null => {
  const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regex);
  return match && match[1].length === 11 ? match[1] : null;
};

export default function YoutubeForm({ 
  onCancel, 
  onYoutubeAdd,
  isOpen
}: YoutubeFormProps) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
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
      setYoutubeId(null);
    }
  }, [isOpen]);

  // URL 유효성 검사 및 YouTube ID 추출
  const validateYoutubeUrl = (input: string) => {
    const id = getYoutubeId(input);
    setYoutubeId(id);
    return !!id;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    const isValid = validateYoutubeUrl(input);
    setIsValidUrl(isValid);
  };

  const handleSubmit = () => {
    if (!url || !isValidUrl) return;
    
    console.log('유튜브 폼 제출:', { url, caption });
    
    // 캡션과 함께 유튜브 URL 전달
    try {
      onYoutubeAdd(url, caption || undefined);
    } catch (error) {
      console.error('유튜브 추가 중 오류:', error);
      alert('유튜브 동영상을 추가하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-10 bg-white rounded-lg shadow-lg border w-full max-w-80 p-4 mt-2"
      style={{ width: '320px' }}
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
              maxLength={200}
            />
          </div>
          
          {/* 유효한 ID가 있을 때 미리보기 표시 */}
          {youtubeId && (
            <div className="responsive-video-container border rounded-md overflow-hidden">
              <iframe 
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="w-full" 
                height="160"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          
          {!isValidUrl && url && (
            <div className="text-xs text-red-500">
              유효한 YouTube URL을 입력해주세요
            </div>
          )}
          
          <div>
            <div className="text-xs text-gray-500 mb-1">예시:</div>
            <div className="text-xs text-gray-500 mb-1" style={{ wordBreak: 'break-all' }}>
              https://www.youtube.com/watch?v=XXXXXXXXXXX
            </div>
            <div className="text-xs text-gray-500 mb-1">또는:</div>
            <div className="text-xs text-gray-500" style={{ wordBreak: 'break-all' }}>
              https://youtu.be/XXXXXXXXXXX
            </div>
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
          disabled={!url || !isValidUrl}
          className="text-xs py-1 px-2 h-6"
        >
          확인
        </Button>
      </div>
    </div>
  );
} 
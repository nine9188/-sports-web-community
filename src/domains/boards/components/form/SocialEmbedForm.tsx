'use client';

import React, { useState, useEffect, useRef } from 'react';
import { detectPlatform, type SocialPlatform } from '@/shared/ui/tiptap/extensions/social-embeds';

interface SocialEmbedFormProps {
  onCancel: () => void;
  onSocialEmbedAdd: (platform: SocialPlatform, url: string) => void;
  isOpen: boolean;
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  twitter: '트위터 (X)',
  instagram: '인스타그램',
  tiktok: '틱톡',
  youtube: '유튜브',
  facebook: '페이스북',
  linkedin: '링크드인',
};

export default function SocialEmbedForm({ onCancel, onSocialEmbedAdd, isOpen }: SocialEmbedFormProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (url.trim()) {
      const platform = detectPlatform(url);
      setDetectedPlatform(platform);
      if (platform) {
        setError('');
      } else {
        setError('지원하지 않는 URL입니다.');
      }
    } else {
      setDetectedPlatform(null);
      setError('');
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      setError('지원하지 않는 URL입니다. 트위터, 인스타그램, 틱톡, 유튜브, 페이스북, 링크드인 링크를 입력하세요.');
      return;
    }

    onSocialEmbedAdd(platform, url.trim());
    setUrl('');
    setDetectedPlatform(null);
    setError('');
  };

  const handleCancel = () => {
    setUrl('');
    setDetectedPlatform(null);
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div
        ref={dropdownRef}
        className="z-50 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-lg border border-black/7 dark:border-white/10 overflow-hidden fixed sm:absolute left-1/2 top-1/2 sm:left-1/2 sm:top-full -translate-x-1/2 -translate-y-1/2 sm:-translate-x-1/2 sm:translate-y-0 w-[90vw] max-w-md sm:w-[400px]"
        style={{ marginTop: '0.5rem' }}
      >
        <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">소셜 미디어 추가</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div>
              <input
                ref={inputRef}
                type="url"
                id="social-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="https://twitter.com/..."
                className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors text-sm"
              />
              {detectedPlatform && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ {PLATFORM_NAMES[detectedPlatform]} 링크가 감지되었습니다
                </p>
              )}
              {error && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium">지원하는 플랫폼:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>트위터 (X) - https://twitter.com/... 또는 https://x.com/...</li>
                <li>인스타그램 - https://instagram.com/p/...</li>
                <li>틱톡 - https://tiktok.com/@.../video/...</li>
                <li>유튜브 - https://youtube.com/watch?v=... 또는 https://youtu.be/...</li>
                <li>페이스북 - https://facebook.com/.../posts/...</li>
                <li>링크드인 - https://linkedin.com/posts/...</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm rounded-md bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                취소
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                disabled={!detectedPlatform}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

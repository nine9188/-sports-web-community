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
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md shadow-lg p-4 z-50 min-w-[400px]">
      <div className="space-y-3">
        <div>
          <label htmlFor="social-url" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-1">
            소셜 미디어 URL
          </label>
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
            className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-white/20 text-sm"
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
            className="px-3 py-1.5 text-sm rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={!detectedPlatform}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-800 dark:bg-white text-white dark:text-slate-800 hover:bg-slate-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { detectPlatform, type SocialPlatform } from '@/shared/components/editor/tiptap/extensions/social-embeds';

interface SocialEmbedFormProps {
  onCancel: () => void;
  onSocialEmbedAdd: (platform: SocialPlatform, url: string) => void;
  isOpen: boolean;
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  twitter: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

export default function SocialEmbedForm({ onCancel, onSocialEmbedAdd, isOpen }: SocialEmbedFormProps) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      onCancel();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    const nextUrl = url.trim();

    if (!nextUrl) {
      setDetectedPlatform(null);
      setError('');
      return;
    }

    const platform = detectPlatform(nextUrl);
    setDetectedPlatform(platform);
    setError(platform ? '' : '지원하지 않는 URL입니다.');
  }, [url]);

  const reset = () => {
    setUrl('');
    setDetectedPlatform(null);
    setError('');
  };

  const handleSubmit = () => {
    const nextUrl = url.trim();
    const platform = detectPlatform(nextUrl);

    if (!nextUrl) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (!platform) {
      setError('X, Instagram, TikTok, YouTube, Facebook, LinkedIn 링크를 입력해주세요.');
      return;
    }

    onSocialEmbedAdd(platform, nextUrl);
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="w-full rounded-md border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              handleCancel();
            }
          }}
          placeholder="소셜 URL"
          className="h-9 min-w-0 flex-1 rounded border border-black/10 bg-[#F5F5F5] px-3 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-white dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400 dark:focus:bg-[#1D1D1D]"
        />
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-[#EAEAEA] dark:text-gray-300 dark:hover:bg-[#333333]"
          aria-label="닫기"
        >
          <X size={16} />
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!detectedPlatform}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#003CA6] text-white disabled:bg-[#8EA4D8] disabled:text-white/80"
          aria-label="추가"
        >
          <Check size={16} />
        </button>
      </div>
      <div className="mt-1 min-h-4 px-1 text-[11px] leading-4">
        {detectedPlatform ? (
          <span className="text-gray-500 dark:text-gray-400">{PLATFORM_NAMES[detectedPlatform]} 링크</span>
        ) : error ? (
          <span className="text-red-600 dark:text-red-400">{error}</span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">X, Instagram, TikTok, YouTube, Facebook, LinkedIn</span>
        )}
      </div>
    </div>
  );
}

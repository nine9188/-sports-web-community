'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui';
import { Check, X } from 'lucide-react';

interface YoutubeFormProps {
  onCancel: () => void;
  onYoutubeAdd: (url: string) => Promise<void>;
  isOpen: boolean;
}

function getYoutubeId(url: string): string | null {
  const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
  const match = url.match(regex);
  return match && match[1].length === 11 ? match[1] : null;
}

export default function YoutubeForm({
  onCancel,
  onYoutubeAdd,
  isOpen,
}: YoutubeFormProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isValidUrl = !!getYoutubeId(url.trim());

  useEffect(() => {
    if (!isOpen) return;

    setUrl('');
    setIsSubmitting(false);
    const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  const handleSubmit = async () => {
    const nextUrl = url.trim();
    if (!nextUrl || !isValidUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onYoutubeAdd(nextUrl);
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-editor-youtube-popover="true"
      className="w-full rounded-md border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSubmit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
            className={`min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-[#F5F5F5] dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400 ${
              url && !isValidUrl ? 'border-red-300 dark:border-red-500/60' : 'border-black/7 dark:border-white/10'
            }`}
            placeholder="https://youtu.be/... 또는 youtube.com/watch?v=..."
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-700 dark:text-gray-300"
            title="Close"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X size={16} />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="icon"
            className="h-8 w-8"
            title="Insert"
            disabled={!isValidUrl || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            <Check size={16} />
          </Button>
        </div>
        <div className="px-1 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
          YouTube 영상 주소를 붙여넣고 체크를 누르세요.
        </div>
      </div>
    </div>
  );
}

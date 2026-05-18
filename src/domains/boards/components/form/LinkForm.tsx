'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui';
import { Check, Link2Off, X } from 'lucide-react';

interface LinkFormProps {
  onCancel: () => void;
  onLinkAdd: (url: string, text?: string) => void;
  onLinkRemove?: () => void;
  isOpen: boolean;
  currentUrl?: string;
  selectedText?: string;
  canRemove?: boolean;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function LinkForm({
  onCancel,
  onLinkAdd,
  onLinkRemove,
  isOpen,
  currentUrl = '',
  selectedText = '',
  canRemove = false,
}: LinkFormProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setUrl(currentUrl);
    setText(selectedText);
    const id = window.setTimeout(() => urlInputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(id);
  }, [currentUrl, isOpen, selectedText]);

  const handleSubmit = () => {
    const nextUrl = normalizeUrl(url);
    if (!nextUrl) return;

    onLinkAdd(nextUrl, text.trim() || undefined);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      data-editor-link-popover="true"
      className="w-full rounded-md border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            ref={urlInputRef}
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-black/7 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400"
            placeholder="https://example.com"
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-700 dark:text-gray-300"
              title="링크 제거"
              onClick={() => {
                onLinkRemove?.();
                onCancel();
              }}
            >
              <Link2Off size={15} />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-700 dark:text-gray-300"
            title="닫기"
            onClick={onCancel}
          >
            <X size={16} />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="icon"
            className="h-8 w-8"
            title="적용"
            disabled={!url.trim()}
            onClick={handleSubmit}
          >
            <Check size={16} />
          </Button>
        </div>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          className="w-full rounded-md border border-black/7 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400"
          placeholder="표시 텍스트"
        />
      </div>
    </div>
  );
}

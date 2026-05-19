'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { PostPollDraft } from '@/domains/boards/types/poll';

interface PollFormProps {
  isOpen: boolean;
  initialPoll?: PostPollDraft | null;
  onCancel: () => void;
  onSave: (poll: PostPollDraft) => void;
  onRemove?: () => void;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

function normalizePoll(question: string, options: string[]): PostPollDraft {
  return {
    question: question.trim(),
    options: options.map((option) => option.trim()).filter(Boolean).slice(0, MAX_OPTIONS),
  };
}

export default function PollForm({ isOpen, initialPoll, onCancel, onSave, onRemove }: PollFormProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    if (!isOpen) return;

    setQuestion(initialPoll?.question ?? '');
    setOptions(() => {
      const initialOptions = initialPoll?.options?.length ? initialPoll.options : [];
      return [...initialOptions, '', ''].slice(
        0,
        Math.max(MIN_OPTIONS, Math.min(MAX_OPTIONS, initialOptions.length || MIN_OPTIONS)),
      );
    });

    const id = window.setTimeout(() => questionRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(id);
  }, [initialPoll, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      onCancel();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onCancel]);

  const normalized = useMemo(() => normalizePoll(question, options), [question, options]);
  const canSave = normalized.question.length > 0 && normalized.options.length >= MIN_OPTIONS;

  if (!isOpen) return null;

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const removeOption = (index: number) => {
    setOptions((current) => {
      if (current.length <= MIN_OPTIONS) {
        return current.map((option, optionIndex) => (optionIndex === index ? '' : option));
      }
      return current.filter((_, optionIndex) => optionIndex !== index);
    });
  };

  const addOption = () => {
    setOptions((current) => (current.length >= MAX_OPTIONS ? current : [...current, '']));
  };

  const savePoll = () => {
    if (!canSave) return;
    onSave(normalized);
    onCancel();
  };

  return (
    <div
      ref={popoverRef}
      data-editor-poll-popover="true"
      className="w-full rounded-md border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#1D1D1D]"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5">
          <input
            ref={questionRef}
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
            maxLength={120}
            className="min-w-0 flex-1 rounded-md border border-black/7 px-2.5 py-1.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400"
            placeholder="투표 질문"
          />
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
            title="저장"
            disabled={!canSave}
            onClick={savePoll}
          >
            <Check size={16} />
          </Button>
        </div>

        <div className="space-y-1.5">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <input
                type="text"
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                maxLength={80}
                className="min-w-0 flex-1 rounded-md border border-black/7 px-2.5 py-1.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0] dark:placeholder:text-gray-400"
                placeholder={`선택지 ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 dark:text-gray-400"
                title="삭제"
                onClick={() => removeOption(index)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5 px-2 text-[12px]"
            disabled={options.length >= MAX_OPTIONS}
            onClick={addOption}
          >
            <Plus size={14} />
            선택지
          </Button>
          {onRemove && initialPoll && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px] text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => {
                onRemove();
                onCancel();
              }}
            >
              투표 삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

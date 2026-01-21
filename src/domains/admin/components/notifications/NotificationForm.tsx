'use client';

import { Users, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import Spinner from '@/shared/components/Spinner';
import type { SendMode, SendResult } from './types';

interface NotificationFormProps {
  sendMode: SendMode;
  selectedCount: number;
  title: string;
  message: string;
  link: string;
  isLoading: boolean;
  result: SendResult | null;
  onSendModeChange: (mode: SendMode) => void;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onSend: () => void;
}

export function NotificationForm({
  sendMode,
  selectedCount,
  title,
  message,
  link,
  isLoading,
  result,
  onSendModeChange,
  onTitleChange,
  onMessageChange,
  onLinkChange,
  onSend,
}: NotificationFormProps) {
  const inputClassName =
    'w-full px-4 py-2 rounded-lg bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400';

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">공지 내용 작성</h2>

      <div className="space-y-4">
        {/* 발송 모드 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            발송 대상
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => onSendModeChange('all')}
              variant={sendMode === 'all' ? 'primary' : 'outline'}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              전체 사용자
            </Button>
            <Button
              onClick={() => onSendModeChange('selected')}
              variant={sendMode === 'selected' ? 'primary' : 'outline'}
              className="flex-1"
            >
              선택한 사용자 ({selectedCount}명)
            </Button>
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="알림 제목을 입력하세요"
            className={inputClassName}
            maxLength={100}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            내용 *
          </label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="알림 내용을 입력하세요"
            rows={6}
            className={`${inputClassName} resize-none`}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message.length}/500</p>
        </div>

        {/* 링크 (선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            링크 (선택)
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => onLinkChange(e.target.value)}
            placeholder="/boards/notice/123"
            className={inputClassName}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            알림 클릭 시 이동할 페이지 경로
          </p>
        </div>

        {/* 발송 버튼 */}
        <button
          onClick={onSend}
          disabled={isLoading || !title.trim() || !message.trim()}
          className="w-full py-3 px-4 bg-[#262626] dark:bg-[#3F3F3F] hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              발송 중...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              알림 발송
            </>
          )}
        </button>

        {/* 결과 메시지 */}
        {result && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              result.success
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui';
import type { PageSeoOverride } from './types';

interface SeoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  path: string;
  data: PageSeoOverride;
  isLoading: boolean;
  onPathChange?: (path: string) => void;
  onDataChange: (data: PageSeoOverride) => void;
  onSave: () => void;
}

export function SeoEditModal({
  isOpen,
  onClose,
  mode,
  path,
  data,
  isLoading,
  onPathChange,
  onDataChange,
  onSave,
}: SeoEditModalProps) {
  const isAddMode = mode === 'add';

  const inputClassName = "w-full px-3 py-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAddMode ? '페이지 SEO 추가' : '페이지 SEO 수정'}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="space-y-4">
          {!isAddMode && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <code className="bg-gray-200 dark:bg-[#363636] px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                {path}
              </code>
            </p>
          )}

          {isAddMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                페이지 경로 *
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => onPathChange?.(e.target.value)}
                placeholder="/livescore"
                className={inputClassName}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => onDataChange({ ...data, title: e.target.value })}
              placeholder="페이지 제목"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              설명 (150-160자 권장)
            </label>
            <textarea
              value={data.description}
              onChange={(e) => onDataChange({ ...data, description: e.target.value })}
              rows={3}
              maxLength={200}
              placeholder="페이지 설명"
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {data.description?.length || 0} / 200자
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button variant="primary" onClick={onSave} disabled={isLoading}>
            {isLoading ? (isAddMode ? '추가 중...' : '저장 중...') : (isAddMode ? '추가' : '저장')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

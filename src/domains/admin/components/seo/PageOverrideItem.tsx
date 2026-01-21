'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import type { PageSeoOverride, PredefinedPage } from './types';

interface PageOverrideItemProps {
  path: string;
  name: string;
  override: PageSeoOverride | undefined;
  defaultTitle?: string;
  defaultDescription?: string;
  onEdit: () => void;
  onDelete?: () => void;
  size?: 'normal' | 'small';
}

export function PageOverrideItem({
  path,
  name,
  override,
  defaultTitle,
  defaultDescription,
  onEdit,
  onDelete,
  size = 'normal',
}: PageOverrideItemProps) {
  const hasOverride = !!override;
  const isSmall = size === 'small';

  const containerClassName = `border rounded-lg ${isSmall ? 'p-2.5' : 'p-4'} ${
    hasOverride
      ? 'border-gray-400 dark:border-gray-500 bg-[#F5F5F5] dark:bg-[#262626]'
      : 'border-black/7 dark:border-white/10'
  }`;

  return (
    <div className={containerClassName}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-gray-900 dark:text-[#F0F0F0] ${isSmall ? 'text-sm' : ''}`}>
              {name}
            </span>
            <code className={`bg-gray-200 dark:bg-[#363636] px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 ${isSmall ? 'text-xs' : 'text-xs'}`}>
              {path}
            </code>
            {hasOverride && (
              <span className={`bg-gray-300 dark:bg-[#404040] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded ${isSmall ? 'text-xs' : 'text-xs'}`}>
                커스텀
              </span>
            )}
          </div>

          {!isSmall && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <div>
                <span className="text-gray-500 dark:text-gray-500">제목:</span>{' '}
                {override?.title || (
                  <span className="text-gray-400 dark:text-gray-500">
                    {defaultTitle} (기본값)
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-500">설명:</span>{' '}
                {override?.description || (
                  <span className="text-gray-400 dark:text-gray-500">
                    {defaultDescription} (기본값)
                  </span>
                )}
              </div>
            </div>
          )}

          {isSmall && override && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {override.title}
            </div>
          )}
        </div>

        <div className={`flex gap-2 ${isSmall ? 'gap-1' : 'ml-4'}`}>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className={isSmall ? 'text-xs px-2 py-1 h-auto' : ''}
          >
            <Edit2 className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            {!isSmall && '수정'}
          </Button>
          {hasOverride && onDelete && (
            <Button
              onClick={onDelete}
              variant="destructive"
              size="sm"
              className={isSmall ? 'text-xs px-2 py-1 h-auto' : ''}
            >
              <Trash2 className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              {!isSmall && '초기화'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

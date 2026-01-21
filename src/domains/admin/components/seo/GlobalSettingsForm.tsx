'use client';

import { Save } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import type { GlobalSettingsData } from './types';

interface GlobalSettingsFormProps {
  settings: GlobalSettingsData;
  onChange: (settings: GlobalSettingsData) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function GlobalSettingsForm({
  settings,
  onChange,
  onSave,
  isLoading,
}: GlobalSettingsFormProps) {
  const inputClassName = "w-full px-3 py-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">전역 기본 설정</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            사이트명 *
          </label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => onChange({ ...settings, site_name: e.target.value })}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            사이트 URL *
          </label>
          <input
            type="url"
            value={settings.site_url}
            onChange={(e) => onChange({ ...settings, site_url: e.target.value })}
            placeholder="https://example.com"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            기본 제목 *
          </label>
          <input
            type="text"
            value={settings.default_title}
            onChange={(e) => onChange({ ...settings, default_title: e.target.value })}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            기본 설명 (150-160자 권장)
          </label>
          <textarea
            value={settings.default_description}
            onChange={(e) => onChange({ ...settings, default_description: e.target.value })}
            rows={3}
            maxLength={160}
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {settings.default_description?.length || 0} / 160자
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            기본 키워드 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={settings.default_keywords?.join(', ') || ''}
            onChange={(e) =>
              onChange({
                ...settings,
                default_keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
              })
            }
            placeholder="축구, 커뮤니티, 라이브스코어"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Twitter 핸들
          </label>
          <input
            type="text"
            value={settings.twitter_handle}
            onChange={(e) => onChange({ ...settings, twitter_handle: e.target.value })}
            placeholder="@4590football"
            className={inputClassName}
          />
        </div>

        <Button onClick={onSave} disabled={isLoading} variant="primary">
          <Save className="w-4 h-4" />
          {isLoading ? '저장 중...' : '전역 설정 저장'}
        </Button>
      </div>
    </div>
  );
}

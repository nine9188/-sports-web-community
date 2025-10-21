'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSetting } from '@/domains/site-config/types';
import { updateMultipleSiteSettings } from '@/domains/site-config/actions';
import toast from 'react-hot-toast';

interface GeneralSettingsFormProps {
  initialSettings: SiteSetting[];
}

export default function GeneralSettingsForm({ initialSettings }: GeneralSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(() => {
    const data: Record<string, any> = {};
    initialSettings.forEach(setting => {
      data[setting.key] = setting.value;
    });
    return data;
  });

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const settings = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
      }));

      const result = await updateMultipleSiteSettings(settings);

      if (result.success) {
        toast.success('설정이 저장되었습니다');
        router.refresh();
      } else {
        toast.error(result.error || '설정 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast.error('설정 저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (setting: SiteSetting) => {
    const value = formData[setting.key];

    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={setting.key}
              checked={value === true}
              onChange={(e) => handleChange(setting.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={setting.key} className="ml-2 text-sm text-gray-700">
              활성화
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={setting.key}
            value={value || 0}
            onChange={(e) => handleChange(setting.key, parseInt(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'text':
      default:
        return (
          <textarea
            id={setting.key}
            value={value || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            rows={setting.key === 'announcement' ? 3 : 1}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {initialSettings.map((setting) => (
            <div key={setting.key}>
              <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700 mb-1">
                {setting.label}
                {setting.is_public && (
                  <span className="ml-2 text-xs text-blue-600">(공개)</span>
                )}
              </label>
              {setting.description && (
                <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
              )}
              {renderField(setting)}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}

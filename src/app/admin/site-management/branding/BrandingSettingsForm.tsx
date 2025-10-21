'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSetting } from '@/domains/site-config/types';
import { updateMultipleSiteSettings } from '@/domains/site-config/actions';
import toast from 'react-hot-toast';
import { Palette } from 'lucide-react';

interface BrandingSettingsFormProps {
  initialSettings: SiteSetting[];
}

export default function BrandingSettingsForm({ initialSettings }: BrandingSettingsFormProps) {
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
        toast.success('브랜딩 설정이 저장되었습니다');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 색상 설정 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            색상 및 텍스트
          </h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 테마 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              테마 색상
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              사이트의 메인 컬러 (HEX 코드)
            </p>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={formData.theme_color || '#1a73e8'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.theme_color || '#1a73e8'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                placeholder="#1a73e8"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2 p-3 rounded" style={{ backgroundColor: formData.theme_color || '#1a73e8' }}>
              <p className="text-white text-sm font-medium">미리보기</p>
            </div>
          </div>

          {/* 로고 텍스트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              로고 텍스트
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              사이트 로고에 표시될 텍스트
            </p>
            <input
              type="text"
              value={formData.logo_text || ''}
              onChange={(e) => handleChange('logo_text', e.target.value)}
              placeholder="SPORTS"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 파일 URL 설정 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">이미지 파일 (URL)</h2>
          <p className="text-sm text-gray-500">현재는 URL만 지원합니다. 추후 업로드 기능이 추가됩니다.</p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 메인 로고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메인 로고 URL
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              사이트 헤더에 표시될 로고 이미지
            </p>
            <input
              type="text"
              value={formData.logo_url || ''}
              onChange={(e) => handleChange('logo_url', e.target.value)}
              placeholder="/logo/main-logo.png"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.logo_url && (
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <img src={formData.logo_url} alt="로고 미리보기" className="h-16 object-contain" />
              </div>
            )}
          </div>

          {/* 다크 모드 로고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              다크 모드 로고 URL
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              다크 모드에서 표시될 로고 (선택사항)
            </p>
            <input
              type="text"
              value={formData.logo_dark_url || ''}
              onChange={(e) => handleChange('logo_dark_url', e.target.value)}
              placeholder="/logo/main-logo-dark.png"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 파비콘 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              파비콘 URL
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              브라우저 탭에 표시될 아이콘 (16x16, 32x32)
            </p>
            <input
              type="text"
              value={formData.favicon_url || ''}
              onChange={(e) => handleChange('favicon_url', e.target.value)}
              placeholder="/favicon.ico"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 변경 후 브라우저 캐시를 지워야 반영됩니다
            </p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="bg-white shadow rounded-lg">
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

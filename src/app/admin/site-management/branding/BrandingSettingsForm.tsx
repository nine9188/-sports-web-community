'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSetting } from '@/domains/site-config/types';
import { updateMultipleSiteSettings } from '@/domains/site-config/actions';
import { toast } from 'react-toastify';
import { Palette } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { inputBaseStyles, focusStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

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
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
        <div className="px-6 py-4 border-b border-black/7 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            색상 및 텍스트
          </h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 테마 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              테마 색상
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              사이트의 메인 컬러 (HEX 코드)
            </p>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={formData.theme_color || '#1a73e8'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                className="h-10 w-20 rounded border border-black/7 dark:border-white/10 cursor-pointer bg-white dark:bg-[#262626]"
              />
              <input
                type="text"
                value={formData.theme_color || '#1a73e8'}
                onChange={(e) => handleChange('theme_color', e.target.value)}
                placeholder="#1a73e8"
                className={cn("flex-1 px-3 py-2 rounded-md", inputBaseStyles, focusStyles)}
              />
            </div>
            <div className="mt-2 p-3 rounded" style={{ backgroundColor: formData.theme_color || '#1a73e8' }}>
              <p className="text-white text-sm font-medium">미리보기</p>
            </div>
          </div>

          {/* 로고 텍스트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              로고 텍스트
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              사이트 로고에 표시될 텍스트
            </p>
            <input
              type="text"
              value={formData.logo_text || ''}
              onChange={(e) => handleChange('logo_text', e.target.value)}
              placeholder="SPORTS"
              className={cn("block w-full px-3 py-2 rounded-md", inputBaseStyles, focusStyles)}
            />
          </div>
        </div>
      </div>

      {/* 파일 URL 설정 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
        <div className="px-6 py-4 border-b border-black/7 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">이미지 파일 (URL)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">현재는 URL만 지원합니다. 추후 업로드 기능이 추가됩니다.</p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 메인 로고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              메인 로고 URL
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              사이트 헤더에 표시될 로고 이미지
            </p>
            <input
              type="text"
              value={formData.logo_url || ''}
              onChange={(e) => handleChange('logo_url', e.target.value)}
              placeholder="/logo/main-logo.png"
              className={cn("block w-full px-3 py-2 rounded-md", inputBaseStyles, focusStyles)}
            />
            {formData.logo_url && (
              <div className="mt-2 p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded border border-black/7 dark:border-white/10">
                <img src={formData.logo_url} alt="로고 미리보기" className="h-16 object-contain" />
              </div>
            )}
          </div>

          {/* 다크 모드 로고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              다크 모드 로고 URL
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              다크 모드에서 표시될 로고 (선택사항)
            </p>
            <input
              type="text"
              value={formData.logo_dark_url || ''}
              onChange={(e) => handleChange('logo_dark_url', e.target.value)}
              placeholder="/logo/main-logo-dark.png"
              className={cn("block w-full px-3 py-2 rounded-md", inputBaseStyles, focusStyles)}
            />
          </div>

          {/* 파비콘 안내 */}
          <div className="bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">파비콘 관리</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              파비콘은 <code className="px-1 bg-gray-200 dark:bg-[#363636] rounded">/public</code> 폴더에서 직접 관리됩니다.
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <strong>favicon.ico</strong>: 브라우저 탭 아이콘</li>
              <li>• <strong>apple-icon.png</strong>: iOS 홈 화면 아이콘</li>
              <li>• <strong>icon-192.png, icon-512.png</strong>: PWA 아이콘</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              파비콘 상태는 아래 "파비콘 상태" 섹션에서 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
        <div className="px-6 py-4 bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/7 dark:border-white/10 flex justify-end gap-3 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </form>
  );
}

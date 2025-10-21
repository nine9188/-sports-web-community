'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSetting } from '@/domains/site-config/types';
import { updateMultipleSiteSettings } from '@/domains/site-config/actions';
import toast from 'react-hot-toast';

interface SEOSettingsFormProps {
  initialSettings: SiteSetting[];
}

export default function SEOSettingsForm({ initialSettings }: SEOSettingsFormProps) {
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

  const handleKeywordsChange = (value: string) => {
    // 쉼표로 구분된 문자열을 배열로 변환
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    handleChange('site_keywords', keywords);
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
        toast.success('SEO 설정이 저장되었습니다');
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

  const keywordsValue = Array.isArray(formData.site_keywords)
    ? formData.site_keywords.join(', ')
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">기본 SEO 설정</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 사이트 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사이트 설명
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              검색 결과에 표시될 설명입니다 (150-160자 권장)
            </p>
            <textarea
              value={formData.site_description || ''}
              onChange={(e) => handleChange('site_description', e.target.value)}
              rows={3}
              maxLength={160}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.site_description?.length || 0} / 160자
            </p>
          </div>

          {/* 키워드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 키워드
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              쉼표(,)로 구분하여 입력하세요
            </p>
            <input
              type="text"
              value={keywordsValue}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="축구, 스포츠, 커뮤니티"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* OG 기본 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 OG 이미지
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              SNS 공유 시 표시될 이미지 URL (1200x630px 권장)
            </p>
            <input
              type="text"
              value={formData.og_default_image || ''}
              onChange={(e) => handleChange('og_default_image', e.target.value)}
              placeholder="/branding/og/og-default.jpg"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 트위터 핸들 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              트위터 핸들
              <span className="ml-2 text-xs text-blue-600">(공개)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              트위터 계정명 (@포함)
            </p>
            <input
              type="text"
              value={formData.twitter_handle || ''}
              onChange={(e) => handleChange('twitter_handle', e.target.value)}
              placeholder="@yourdomain"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
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

'use client';

import { useState, useEffect } from 'react';
import { getUIThemeSettings, updateUIThemeSettings } from '@/domains/ui-theme/actions';

const borderRadiusOptions = [
  { value: 'rounded-none', label: '사각형 (0px)', preview: '0' },
  { value: 'rounded-sm', label: '약간 둥글게 (2px)', preview: '0.125rem' },
  { value: 'rounded', label: '둥글게 (4px)', preview: '0.25rem' },
  { value: 'rounded-md', label: '중간 둥글게 (6px)', preview: '0.375rem' },
  { value: 'rounded-lg', label: '많이 둥글게 (8px)', preview: '0.5rem' },
  { value: 'rounded-xl', label: '더 둥글게 (12px)', preview: '0.75rem' },
  { value: 'rounded-2xl', label: '매우 둥글게 (16px)', preview: '1rem' },
];

export default function UIThemeSettingsPage() {
  const [desktopRadius, setDesktopRadius] = useState('rounded-lg');
  const [mobileRadius, setMobileRadius] = useState('rounded-none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getUIThemeSettings();
        setDesktopRadius(settings.borderRadiusDesktop);
        setMobileRadius(settings.borderRadiusMobile);
      } catch (error) {
        console.error('설정 로드 실패:', error);
        setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // 저장 핸들러
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateUIThemeSettings({
        borderRadiusDesktop: desktopRadius,
        borderRadiusMobile: mobileRadius
      });

      if (result.success) {
        setMessage({ type: 'success', text: '설정이 저장되었습니다. 페이지를 새로고침하면 변경사항이 반영됩니다.' });
        // 페이지 자동 새로고침 (CSS Variables 적용)
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || '저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-[#363636] rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-[#363636] rounded w-96 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-[#363636] rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-[#363636] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F0F0F0]">UI 테마 설정</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          사이트 전체의 UI 스타일을 설정합니다. 변경 후 저장하면 모든 컴포넌트에 즉시 적용됩니다.
        </p>
      </div>

      {/* 알림 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* 데스크탑 설정 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">데스크탑 (PC) 테두리</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {borderRadiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDesktopRadius(option.value)}
              className={`p-4 border-2 rounded-lg transition-all ${
                desktopRadius === option.value
                  ? 'border-gray-900 dark:border-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626]'
                  : 'border-black/7 dark:border-white/10 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div
                className="w-full h-16 bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700 mb-2"
                style={{ borderRadius: option.preview }}
              ></div>
              <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 모바일 설정 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">모바일 테두리</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {borderRadiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setMobileRadius(option.value)}
              className={`p-4 border-2 rounded-lg transition-all ${
                mobileRadius === option.value
                  ? 'border-gray-900 dark:border-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626]'
                  : 'border-black/7 dark:border-white/10 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div
                className="w-full h-16 bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-600 mb-2"
                style={{ borderRadius: option.preview }}
              ></div>
              <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">미리보기</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">데스크탑</p>
            <div
              className="border-2 border-black/7 dark:border-white/10 bg-white dark:bg-[#262626] p-4"
              style={{ borderRadius: borderRadiusOptions.find(o => o.value === desktopRadius)?.preview }}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">위젯 예시</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">이렇게 표시됩니다</div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">모바일</p>
            <div
              className="border-2 border-black/7 dark:border-white/10 bg-white dark:bg-[#262626] p-4"
              style={{ borderRadius: borderRadiusOptions.find(o => o.value === mobileRadius)?.preview }}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">위젯 예시</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">이렇게 표시됩니다</div>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-gray-900 dark:bg-[#F0F0F0] text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>

      {/* 안내 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">사용 안내</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• <strong>데스크탑</strong>: PC/태블릿에서 표시되는 컴포넌트의 테두리 스타일</li>
          <li>• <strong>모바일</strong>: 스마트폰에서 표시되는 컴포넌트의 테두리 스타일</li>
          <li>• 변경사항은 <strong>위젯, 카드, 패널 등 모든 컴포넌트</strong>에 자동 적용됩니다</li>
          <li>• 저장 후 페이지가 자동으로 새로고침되어 변경사항이 즉시 반영됩니다</li>
        </ul>
      </div>
    </div>
  );
}

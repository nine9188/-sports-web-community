'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save } from 'lucide-react';
import {
  SeoSettings,
  PageSeoOverride,
  updateGlobalSeo,
  updatePageSeo,
  deletePageSeo,
} from '@/domains/seo/actions/seoSettings';

interface Props {
  initialSettings: SeoSettings;
}

export default function SeoSettingsPage({ initialSettings }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 전역 설정
  const [globalSettings, setGlobalSettings] = useState({
    site_name: initialSettings.site_name,
    site_url: initialSettings.site_url,
    default_title: initialSettings.default_title,
    default_description: initialSettings.default_description,
    default_keywords: initialSettings.default_keywords,
    og_image: initialSettings.og_image,
    twitter_handle: initialSettings.twitter_handle,
  });

  // 페이지별 설정
  const [pageOverrides, setPageOverrides] = useState<Record<string, PageSeoOverride>>(
    initialSettings.page_overrides || {}
  );

  // 새 페이지 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPagePath, setNewPagePath] = useState('');
  const [newPageData, setNewPageData] = useState<PageSeoOverride>({
    title: '',
    description: '',
    keywords: [],
  });

  // 전역 설정 저장
  const handleSaveGlobal = async () => {
    setIsLoading(true);
    try {
      const result = await updateGlobalSeo(globalSettings);

      if (result.success) {
        toast.success('✅ 전역 SEO 설정이 저장되었습니다');
        router.refresh();
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('전역 SEO 저장 오류:', error);
      toast.error('❌ 저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지별 설정 추가
  const handleAddPage = async () => {
    if (!newPagePath || !newPageData.title) {
      toast.error('❌ 경로와 제목은 필수입니다');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePageSeo(newPagePath, newPageData);

      if (result.success) {
        toast.success('✅ 페이지 SEO가 추가되었습니다');
        setShowAddModal(false);
        setNewPagePath('');
        setNewPageData({ title: '', description: '', keywords: [] });
        router.refresh();
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('페이지 SEO 추가 오류:', error);
      toast.error('❌ 추가 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지별 설정 삭제
  const handleDeletePage = async (path: string) => {
    if (!confirm(`"${path}" 페이지의 SEO 설정을 삭제하시겠습니까?`)) return;

    setIsLoading(true);
    try {
      const result = await deletePageSeo(path);

      if (result.success) {
        toast.success('✅ 페이지 SEO가 삭제되었습니다');
        router.refresh();
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('페이지 SEO 삭제 오류:', error);
      toast.error('❌ 삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO 설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          사이트 전체 및 페이지별 메타데이터를 관리합니다
        </p>
      </div>

      {/* ===== 전역 기본 설정 ===== */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">전역 기본 설정</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사이트명 *
            </label>
            <input
              type="text"
              value={globalSettings.site_name}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, site_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사이트 URL *
            </label>
            <input
              type="url"
              value={globalSettings.site_url}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, site_url: e.target.value })
              }
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 제목 *
            </label>
            <input
              type="text"
              value={globalSettings.default_title}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, default_title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 설명 (150-160자 권장)
            </label>
            <textarea
              value={globalSettings.default_description}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, default_description: e.target.value })
              }
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">
              {globalSettings.default_description?.length || 0} / 160자
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기본 키워드 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={globalSettings.default_keywords?.join(', ') || ''}
              onChange={(e) =>
                setGlobalSettings({
                  ...globalSettings,
                  default_keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                })
              }
              placeholder="축구, 커뮤니티, 라이브스코어"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter 핸들
            </label>
            <input
              type="text"
              value={globalSettings.twitter_handle}
              onChange={(e) =>
                setGlobalSettings({ ...globalSettings, twitter_handle: e.target.value })
              }
              placeholder="@4590football"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={handleSaveGlobal}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? '저장 중...' : '전역 설정 저장'}
          </button>
        </div>
      </div>

      {/* ===== 페이지별 커스터마이징 ===== */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">페이지별 커스터마이징 (선택)</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            페이지 추가
          </button>
        </div>

        {Object.keys(pageOverrides).length === 0 ? (
          <p className="text-sm text-gray-500">
            페이지별 커스터마이징이 없습니다. 추가 버튼을 눌러 시작하세요.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(pageOverrides).map(([path, override]) => (
              <div key={path} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{path}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>제목: {override.title || '(없음)'}</div>
                      <div>설명: {override.description || '(없음)'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePage(path)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== 추가 모달 ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">페이지 SEO 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  페이지 경로 *
                </label>
                <input
                  type="text"
                  value={newPagePath}
                  onChange={(e) => setNewPagePath(e.target.value)}
                  placeholder="/livescore"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={newPageData.title}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, title: e.target.value })
                  }
                  placeholder="실시간 라이브스코어"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={newPageData.description}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="EPL, 라리가 등 실시간 스코어"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPagePath('');
                  setNewPageData({ title: '', description: '', keywords: [] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddPage}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

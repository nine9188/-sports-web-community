'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import {
  SeoSettings,
  PageSeoOverride,
  updateGlobalSeo,
  updatePageSeo,
  deletePageSeo,
} from '@/domains/seo/actions/seoSettings';
import { Button } from '@/shared/components/ui';
import {
  type BoardData,
  type GlobalSettingsData,
  PREDEFINED_PAGES,
  SeoEditModal,
  GlobalSettingsForm,
  PageOverrideItem,
} from '@/domains/admin/components/seo';

interface Props {
  initialSettings: SeoSettings;
  boards: BoardData[];
}

export default function SeoSettingsPage({ initialSettings, boards }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 전역 설정
  const [globalSettings, setGlobalSettings] = useState<GlobalSettingsData>({
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

  // 모달 상태
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingPath, setEditingPath] = useState('');
  const [editingData, setEditingData] = useState<PageSeoOverride>({
    title: '',
    description: '',
    keywords: [],
  });

  // 페이지 추가/수정 모달 열기
  const openAddModal = () => {
    setModalMode('add');
    setEditingPath('');
    setEditingData({ title: '', description: '', keywords: [] });
  };

  const openEditModal = (path: string, defaultTitle?: string, defaultDescription?: string) => {
    setModalMode('edit');
    setEditingPath(path);
    const currentOverride = pageOverrides[path];
    setEditingData({
      title: currentOverride?.title || defaultTitle || '',
      description: currentOverride?.description || defaultDescription || '',
      keywords: currentOverride?.keywords || [],
    });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingPath('');
    setEditingData({ title: '', description: '', keywords: [] });
  };

  // 모달 저장
  const handleModalSave = async () => {
    const targetPath = modalMode === 'add' ? editingPath : editingPath;

    if (!targetPath || !editingData.title) {
      toast.error(modalMode === 'add' ? '경로와 제목은 필수입니다' : '제목은 필수입니다');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePageSeo(targetPath, editingData);
      if (result.success) {
        toast.success(modalMode === 'add' ? '페이지 SEO가 추가되었습니다' : '페이지 SEO가 저장되었습니다');
        closeModal();
        setPageOverrides({ ...pageOverrides, [targetPath]: editingData });
        router.refresh();
      } else {
        toast.error(result.error || '저장 실패');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 전역 설정 저장
  const handleSaveGlobal = async () => {
    setIsLoading(true);
    try {
      const result = await updateGlobalSeo(globalSettings);
      if (result.success) {
        toast.success('전역 SEO 설정이 저장되었습니다');
        router.refresh();
      } else {
        toast.error(result.error || '저장 실패');
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
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
        toast.success('페이지 SEO가 삭제되었습니다');
        const newOverrides = { ...pageOverrides };
        delete newOverrides[path];
        setPageOverrides(newOverrides);
        router.refresh();
      } else {
        toast.error(result.error || '삭제 실패');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 커스텀 페이지 목록 (미리 정의되지 않은 것들)
  const customPages = Object.entries(pageOverrides).filter(
    ([path]) =>
      !PREDEFINED_PAGES.some((p) => p.path === path) &&
      !boards.some((b) => `/boards/${b.slug}` === path)
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">SEO 설정</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          사이트 전체 및 페이지별 메타데이터를 관리합니다
        </p>
      </div>

      {/* 전역 기본 설정 */}
      <GlobalSettingsForm
        settings={globalSettings}
        onChange={setGlobalSettings}
        onSave={handleSaveGlobal}
        isLoading={isLoading}
      />

      {/* 페이지별 커스터마이징 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
              페이지별 SEO 설정
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              각 페이지의 메타 제목과 설명을 커스터마이징할 수 있습니다.
            </p>
          </div>
          <Button onClick={openAddModal} variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            직접 추가
          </Button>
        </div>

        {/* 미리 정의된 페이지 목록 */}
        <div className="space-y-2">
          {PREDEFINED_PAGES.map((page) => (
            <PageOverrideItem
              key={page.path}
              path={page.path}
              name={page.name}
              override={pageOverrides[page.path]}
              defaultTitle={page.defaultTitle}
              defaultDescription={page.defaultDescription}
              onEdit={() => openEditModal(page.path, page.defaultTitle, page.defaultDescription)}
              onDelete={() => handleDeletePage(page.path)}
            />
          ))}
        </div>

        {/* 게시판 목록 */}
        {boards.length > 0 && (
          <div className="border-t border-black/7 dark:border-white/10 mt-6 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">게시판</h3>
            <div className="space-y-2">
              {boards
                .filter((board) => !board.parent_id)
                .map((board) => {
                  const boardPath = `/boards/${board.slug}`;
                  const childBoards = boards.filter((b) => b.parent_id === board.id);

                  return (
                    <div key={board.id}>
                      <PageOverrideItem
                        path={boardPath}
                        name={board.name}
                        override={pageOverrides[boardPath]}
                        defaultTitle={`${board.name} - 4590 Football`}
                        defaultDescription={`${board.name} 게시판입니다.`}
                        onEdit={() =>
                          openEditModal(
                            boardPath,
                            `${board.name} - 4590 Football`,
                            `${board.name} 게시판입니다.`
                          )
                        }
                        onDelete={() => handleDeletePage(boardPath)}
                        size="small"
                      />

                      {/* 하위 게시판 */}
                      {childBoards.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {childBoards.map((child) => {
                            const childPath = `/boards/${child.slug}`;
                            return (
                              <PageOverrideItem
                                key={child.id}
                                path={childPath}
                                name={child.name}
                                override={pageOverrides[childPath]}
                                defaultTitle={`${child.name} - 4590 Football`}
                                defaultDescription={`${child.name} 게시판입니다.`}
                                onEdit={() =>
                                  openEditModal(
                                    childPath,
                                    `${child.name} - 4590 Football`,
                                    `${child.name} 게시판입니다.`
                                  )
                                }
                                onDelete={() => handleDeletePage(childPath)}
                                size="small"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 커스텀 페이지 목록 */}
        {customPages.length > 0 && (
          <div className="border-t border-black/7 dark:border-white/10 mt-6 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              직접 추가한 페이지
            </h3>
            <div className="space-y-2">
              {customPages.map(([path, override]) => (
                <PageOverrideItem
                  key={path}
                  path={path}
                  name={path}
                  override={override}
                  onEdit={() => openEditModal(path)}
                  onDelete={() => handleDeletePage(path)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      <SeoEditModal
        isOpen={modalMode !== null}
        onClose={closeModal}
        mode={modalMode || 'add'}
        path={editingPath}
        data={editingData}
        isLoading={isLoading}
        onPathChange={modalMode === 'add' ? setEditingPath : undefined}
        onDataChange={setEditingData}
        onSave={handleModalSave}
      />
    </div>
  );
}

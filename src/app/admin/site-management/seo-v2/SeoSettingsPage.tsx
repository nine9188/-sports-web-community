'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';
import {
  SeoSettings,
  PageSeoOverride,
  updateGlobalSeo,
  updatePageSeo,
  deletePageSeo,
} from '@/domains/seo/actions/seoSettings';
import { Button } from '@/shared/components/ui';

// 지원하는 페이지 목록 (기본값 포함)
const PREDEFINED_PAGES = [
  // 메인
  { path: '/', name: '메인', defaultTitle: '4590 Football', defaultDescription: '축구 팬들을 위한 커뮤니티. 실시간 라이브스코어, 게시판, 이적시장 정보를 확인하세요.' },

  // 게시판
  { path: '/boards/all', name: '전체글', defaultTitle: '전체글 - 4590 Football', defaultDescription: '모든 게시판의 최신 게시글을 한곳에서 확인하세요.' },
  { path: '/boards/popular', name: '인기글', defaultTitle: '인기글 - 4590 Football', defaultDescription: '가장 인기 있는 게시글을 확인하세요. 좋아요가 많은 순서로 정렬됩니다.' },

  // 라이브스코어
  { path: '/livescore/football', name: '라이브스코어', defaultTitle: '라이브스코어 - 4590 Football', defaultDescription: '실시간 축구 경기 결과와 일정을 확인하세요. 전 세계 주요 리그 경기를 한눈에.' },
  { path: '/livescore/football/leagues', name: '데이터센터', defaultTitle: '데이터센터 - 4590 Football', defaultDescription: '전 세계 주요 축구 리그 목록을 확인하고 원하는 리그의 팀 정보와 경기 결과를 확인하세요.' },

  // 기타 메인 기능
  { path: '/shop', name: '상점', defaultTitle: '상점 - 4590 Football', defaultDescription: '포인트로 다양한 아이템을 구매하세요. 아이콘, 닉네임 변경권 등.' },
  { path: '/transfers', name: '이적시장', defaultTitle: '이적시장 - 4590 Football', defaultDescription: '최신 축구 이적 소식, 영입 정보, 방출 소식을 실시간으로 확인하세요.' },
  { path: '/search', name: '검색', defaultTitle: '검색 - 4590 Football', defaultDescription: '게시글, 댓글, 팀 정보를 통합 검색하세요.' },

  // 알림
  { path: '/notifications', name: '알림', defaultTitle: '알림 - 4590 Football', defaultDescription: '실시간 알림을 확인하세요.' },

  // 설정
  { path: '/settings', name: '설정', defaultTitle: '설정 - 4590 Football', defaultDescription: '계정 설정 및 개인 정보를 관리합니다.' },
  { path: '/settings/profile', name: '프로필 설정', defaultTitle: '프로필 설정 - 4590 Football', defaultDescription: '프로필 및 계정 정보를 관리합니다.' },
  { path: '/settings/password', name: '비밀번호 변경', defaultTitle: '비밀번호 변경 - 4590 Football', defaultDescription: '비밀번호를 변경합니다.' },
  { path: '/settings/points', name: '포인트 내역', defaultTitle: '포인트 내역 - 4590 Football', defaultDescription: '포인트 적립 및 사용 내역을 확인하세요.' },
  { path: '/settings/exp', name: '경험치 내역', defaultTitle: '경험치 내역 - 4590 Football', defaultDescription: '레벨 및 경험치 획득 내역을 확인하세요.' },
  { path: '/settings/my-posts', name: '내 게시글', defaultTitle: '내 게시글 - 4590 Football', defaultDescription: '내가 작성한 게시글을 확인하세요.' },
  { path: '/settings/my-comments', name: '내 댓글', defaultTitle: '내 댓글 - 4590 Football', defaultDescription: '내가 작성한 댓글을 확인하세요.' },
  { path: '/settings/icons', name: '아이콘 설정', defaultTitle: '아이콘 설정 - 4590 Football', defaultDescription: '프로필 아이콘을 변경합니다.' },
  { path: '/settings/phone', name: '전화번호 설정', defaultTitle: '전화번호 설정 - 4590 Football', defaultDescription: '전화번호를 관리합니다.' },
  { path: '/settings/account-delete', name: '계정 탈퇴', defaultTitle: '계정 탈퇴 - 4590 Football', defaultDescription: '계정 탈퇴를 진행합니다.' },

  // 약관
  { path: '/terms', name: '이용약관', defaultTitle: '이용약관 - 4590 Football', defaultDescription: '4590 Football 서비스 이용약관을 확인하세요.' },
  { path: '/privacy', name: '개인정보처리방침', defaultTitle: '개인정보처리방침 - 4590 Football', defaultDescription: '4590 Football 개인정보처리방침을 확인하세요.' },

  // 인증 페이지
  { path: '/signin', name: '로그인', defaultTitle: '로그인 - 4590 Football', defaultDescription: '4590 Football 로그인 페이지입니다.' },
  { path: '/signup', name: '회원가입', defaultTitle: '회원가입 - 4590 Football', defaultDescription: '4590 Football 회원가입 페이지입니다.' },
  { path: '/social-signup', name: '소셜 회원가입', defaultTitle: '소셜 회원가입 - 4590 Football', defaultDescription: 'SNS 계정으로 회원가입을 진행합니다.' },
  { path: '/help/account-recovery', name: '계정 찾기', defaultTitle: '계정 찾기 - 4590 Football', defaultDescription: '아이디/비밀번호 찾기 페이지입니다.' },
  { path: '/help/account-found', name: '계정 찾기 완료', defaultTitle: '계정 찾기 완료 - 4590 Football', defaultDescription: '계정 찾기 결과 안내 페이지입니다.' },
  { path: '/help/reset-password', name: '비밀번호 재설정', defaultTitle: '비밀번호 재설정 - 4590 Football', defaultDescription: '비밀번호 재설정 페이지입니다.' },
  { path: '/auth/confirmed', name: '이메일 인증 완료', defaultTitle: '이메일 인증 완료 - 4590 Football', defaultDescription: '이메일 인증 완료 안내 페이지입니다.' },
];

interface BoardData {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Props {
  initialSettings: SeoSettings;
  boards: BoardData[];
}

export default function SeoSettingsPage({ initialSettings, boards }: Props) {
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

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPath, setEditingPath] = useState('');
  const [editingData, setEditingData] = useState<PageSeoOverride>({
    title: '',
    description: '',
    keywords: [],
  });

  // 페이지 수정 시작
  const handleStartEdit = (path: string, predefinedPage?: typeof PREDEFINED_PAGES[0]) => {
    setEditingPath(path);
    const currentOverride = pageOverrides[path];
    setEditingData({
      title: currentOverride?.title || predefinedPage?.defaultTitle || '',
      description: currentOverride?.description || predefinedPage?.defaultDescription || '',
      keywords: currentOverride?.keywords || [],
    });
    setShowEditModal(true);
  };

  // 페이지 수정 저장
  const handleSaveEdit = async () => {
    if (!editingData.title) {
      toast.error('제목은 필수입니다');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePageSeo(editingPath, editingData);
      if (result.success) {
        toast.success('페이지 SEO가 저장되었습니다');
        setShowEditModal(false);
        setPageOverrides({ ...pageOverrides, [editingPath]: editingData });
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

          <Button
            onClick={handleSaveGlobal}
            disabled={isLoading}
            variant="primary"
          >
            <Save className="w-4 h-4" />
            {isLoading ? '저장 중...' : '전역 설정 저장'}
          </Button>
        </div>
      </div>

      {/* ===== 페이지별 커스터마이징 ===== */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">페이지별 SEO 설정</h2>
            <p className="text-sm text-gray-500 mt-1">
              각 페이지의 메타 제목과 설명을 커스터마이징할 수 있습니다.
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            직접 추가
          </Button>
        </div>

        {/* 미리 정의된 페이지 목록 */}
        <div className="space-y-2">
          {PREDEFINED_PAGES.map((page) => {
            const hasOverride = !!pageOverrides[page.path];
            const override = pageOverrides[page.path];

            return (
              <div
                key={page.path}
                className={`border rounded-lg p-4 ${hasOverride ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{page.name}</span>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{page.path}</code>
                      {hasOverride && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">커스텀</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div>
                        <span className="text-gray-500">제목:</span>{' '}
                        {override?.title || <span className="text-gray-400">{page.defaultTitle} (기본값)</span>}
                      </div>
                      <div>
                        <span className="text-gray-500">설명:</span>{' '}
                        {override?.description || <span className="text-gray-400">{page.defaultDescription} (기본값)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleStartEdit(page.path, page)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      수정
                    </Button>
                    {hasOverride && (
                      <Button
                        onClick={() => handleDeletePage(page.path)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        초기화
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 게시판 목록 */}
        {boards.length > 0 && (
          <div className="border-t mt-6 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">게시판</h3>
            <div className="space-y-2">
              {boards
                .filter(board => !board.parent_id) // 최상위 게시판만
                .map((board) => {
                  const boardPath = `/boards/${board.slug}`;
                  const hasOverride = !!pageOverrides[boardPath];
                  const override = pageOverrides[boardPath];
                  const childBoards = boards.filter(b => b.parent_id === board.id);

                  return (
                    <div key={board.id}>
                      {/* 상위 게시판 */}
                      <div
                        className={`border rounded-lg p-3 ${hasOverride ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{board.name}</span>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{boardPath}</code>
                            {hasOverride && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">커스텀</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStartEdit(boardPath, {
                                path: boardPath,
                                name: board.name,
                                defaultTitle: `${board.name} - 4590 Football`,
                                defaultDescription: `${board.name} 게시판입니다.`,
                              })}
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-auto"
                            >
                              <Edit2 className="w-3 h-3" />
                              수정
                            </Button>
                            {hasOverride && (
                              <Button
                                onClick={() => handleDeletePage(boardPath)}
                                variant="destructive"
                                size="sm"
                                className="text-xs px-2 py-1 h-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {override && (
                          <div className="text-xs text-gray-600 mt-2">
                            {override.title}
                          </div>
                        )}
                      </div>

                      {/* 하위 게시판 */}
                      {childBoards.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {childBoards.map((child) => {
                            const childPath = `/boards/${child.slug}`;
                            const childHasOverride = !!pageOverrides[childPath];
                            const childOverride = pageOverrides[childPath];

                            return (
                              <div
                                key={child.id}
                                className={`border rounded-lg p-2.5 ${childHasOverride ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">{child.name}</span>
                                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{childPath}</code>
                                    {childHasOverride && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">커스텀</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => handleStartEdit(childPath, {
                                        path: childPath,
                                        name: child.name,
                                        defaultTitle: `${child.name} - 4590 Football`,
                                        defaultDescription: `${child.name} 게시판입니다.`,
                                      })}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    {childHasOverride && (
                                      <Button
                                        onClick={() => handleDeletePage(childPath)}
                                        variant="destructive"
                                        size="sm"
                                        className="text-xs px-2 py-1 h-auto"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {childOverride && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {childOverride.title}
                                  </div>
                                )}
                              </div>
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

        {/* 커스텀 페이지 목록 (미리 정의되지 않은 것들) */}
        {Object.entries(pageOverrides)
          .filter(([path]) =>
            !PREDEFINED_PAGES.some(p => p.path === path) &&
            !boards.some(b => `/boards/${b.slug}` === path)
          )
          .length > 0 && (
          <>
            <div className="border-t mt-6 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">직접 추가한 페이지</h3>
              <div className="space-y-2">
                {Object.entries(pageOverrides)
                  .filter(([path]) =>
                    !PREDEFINED_PAGES.some(p => p.path === path) &&
                    !boards.some(b => `/boards/${b.slug}` === path)
                  )
                  .map(([path, override]) => (
                    <div key={path} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{path}</code>
                          <div className="text-sm text-gray-600 mt-2">
                            <div>제목: {override.title}</div>
                            <div>설명: {override.description || '(없음)'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleStartEdit(path)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            수정
                          </Button>
                          <Button
                            onClick={() => handleDeletePage(path)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
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

      {/* ===== 수정 모달 ===== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-1">페이지 SEO 수정</h3>
            <p className="text-sm text-gray-500 mb-4">
              <code className="bg-gray-100 px-2 py-0.5 rounded">{editingPath}</code>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={editingData.title}
                  onChange={(e) =>
                    setEditingData({ ...editingData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (150-160자 권장)
                </label>
                <textarea
                  value={editingData.description}
                  onChange={(e) =>
                    setEditingData({ ...editingData, description: e.target.value })
                  }
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editingData.description?.length || 0} / 200자
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPath('');
                  setEditingData({ title: '', description: '', keywords: [] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

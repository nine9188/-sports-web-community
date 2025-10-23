'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageMetadata } from '@/domains/site-config/types';
import { togglePageMetadataActive, createPageMetadata } from '@/domains/site-config/actions';
import { Eye, EyeOff, ExternalLink, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface PageMetadataListProps {
  pages: PageMetadata[];
}

export default function PageMetadataList({ pages }: PageMetadataListProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPageData, setNewPageData] = useState({
    page_path: '',
    page_type: 'custom' as const,
    title: '',
    description: '',
  });

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const result = await togglePageMetadataActive(id, !currentStatus);

      if (result.success) {
        toast.success(currentStatus ? '비활성화되었습니다' : '활성화되었습니다');
        router.refresh();
      } else {
        toast.error(result.error || '상태 변경에 실패했습니다');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      toast.error('상태 변경 중 오류가 발생했습니다');
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddPage = async () => {
    if (!newPageData.page_path || !newPageData.title) {
      toast.error('페이지 경로와 제목은 필수입니다');
      return;
    }

    setIsAdding(true);
    try {
      const result = await createPageMetadata(newPageData);

      if (result.success) {
        toast.success('페이지가 추가되었습니다');
        setShowAddModal(false);
        setNewPageData({ page_path: '', page_type: 'custom', title: '', description: '' });
        router.refresh();
      } else {
        toast.error(result.error || '페이지 추가에 실패했습니다');
      }
    } catch (error) {
      console.error('페이지 추가 오류:', error);
      toast.error('페이지 추가 중 오류가 발생했습니다');
    } finally {
      setIsAdding(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      default: 'bg-gray-100 text-gray-800',
      boards: 'bg-blue-100 text-blue-800',
      livescore: 'bg-green-100 text-green-800',
      shop: 'bg-purple-100 text-purple-800',
      post: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 페이지 추가
        </button>
      </div>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 페이지 메타데이터 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  페이지 경로 *
                </label>
                <input
                  type="text"
                  value={newPageData.page_path}
                  onChange={(e) => setNewPageData({ ...newPageData, page_path: e.target.value })}
                  placeholder="/example"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  페이지 타입
                </label>
                <select
                  value={newPageData.page_type}
                  onChange={(e) => setNewPageData({ ...newPageData, page_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="custom">Custom</option>
                  <option value="boards">Boards</option>
                  <option value="livescore">Livescore</option>
                  <option value="shop">Shop</option>
                  <option value="post">Post</option>
                  <option value="default">Default</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                  placeholder="페이지 제목"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={newPageData.description}
                  onChange={(e) => setNewPageData({ ...newPageData, description: e.target.value })}
                  placeholder="페이지 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPageData({ page_path: '', page_type: 'custom', title: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddPage}
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAdding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              페이지 경로
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              타입
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제목
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              우선순위
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pages.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                등록된 페이지가 없습니다
              </td>
            </tr>
          ) : (
            pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {page.page_path}
                    </span>
                    <a
                      href={page.page_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(page.page_type)}`}>
                    {page.page_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {page.title || '-'}
                  </div>
                  {page.description && (
                    <div className="text-xs text-gray-500 max-w-xs truncate">
                      {page.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(page.id, page.is_active)}
                    disabled={togglingId === page.id}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                      page.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    } disabled:opacity-50`}
                  >
                    {page.is_active ? (
                      <>
                        <Eye className="w-3 h-3" />
                        활성
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        비활성
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {page.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => {
                      // 추후 수정 모달 구현
                      toast.info('수정 기능은 곧 추가됩니다');
                    }}
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pages.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            총 {pages.length}개의 페이지
          </p>
        </div>
      )}
      </div>
    </>
  );
}

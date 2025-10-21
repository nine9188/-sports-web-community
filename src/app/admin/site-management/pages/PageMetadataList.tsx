'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageMetadata } from '@/domains/site-config/types';
import { togglePageMetadataActive } from '@/domains/site-config/actions';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface PageMetadataListProps {
  pages: PageMetadata[];
}

export default function PageMetadataList({ pages }: PageMetadataListProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
  );
}

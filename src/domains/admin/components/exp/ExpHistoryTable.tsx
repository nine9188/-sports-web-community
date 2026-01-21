'use client';

import Spinner from '@/shared/components/Spinner';
import { Pagination } from '@/shared/components/ui/pagination';
import type { ExpHistoryItem } from './types';

interface ExpHistoryTableProps {
  history: ExpHistoryItem[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ExpHistoryTable({
  history,
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
}: ExpHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <Spinner size="md" className="mx-auto" />
        <p className="text-gray-500 dark:text-gray-400 mt-2">로딩 중...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-md">
        <p className="text-gray-500 dark:text-gray-400">경험치 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-black/7 dark:border-white/10 rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-black/7 dark:divide-white/10">
          <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                일시
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                경험치
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                사유
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/7 dark:divide-white/10">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.created_at || '').toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td
                  className={`px-4 py-2 text-sm font-medium text-right ${item.exp > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {item.exp > 0 ? `+${item.exp}` : item.exp}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} mode="button" maxButtons={5} />
    </>
  );
}

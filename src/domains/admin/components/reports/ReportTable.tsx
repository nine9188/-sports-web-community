'use client';

import { AlertTriangle, CheckCircle, XCircle, Trash2, ChevronDown } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { formatDate } from '@/shared/utils/dateUtils';
import { getStatusText, getTargetTypeText, STATUS_BADGE_VARIANTS } from './utils';
import type { ReportWithReporter } from './types';

interface ReportTableProps {
  reports: ReportWithReporter[];
  isLoading: boolean;
  processingIds: string[];
  actionMenuOpen: string | null;
  onProcessReport: (reportId: string, status: 'reviewed' | 'dismissed' | 'resolved') => void;
  onDropdownToggle: (reportId: string, button: HTMLButtonElement) => void;
}

function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_BADGE_VARIANTS[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant}`}>
      {getStatusText(status)}
    </span>
  );
}

export function ReportTable({
  reports,
  isLoading,
  processingIds,
  actionMenuOpen,
  onProcessReport,
  onDropdownToggle,
}: ReportTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-8 text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">신고 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F5F5F5] dark:bg-[#1D1D1D] border-b border-black/7 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                신고 정보
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                대상
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                신고자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                신고일
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/7 dark:divide-white/10">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D]">
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {report.reason}
                    </div>
                    {report.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                        {report.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300">
                        {getTargetTypeText(report.target_type)}
                      </span>
                    </div>
                    {report.target_info && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                        <div className="truncate">
                          {report.target_info.title || report.target_info.content}
                        </div>
                        <div className="text-xs text-gray-400">
                          작성자: {report.target_info.author}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {report.reporter?.nickname || report.reporter?.email || '알 수 없음'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(report.created_at) || '-'}
                </td>
                <td className="px-4 py-4 text-right">
                  {report.status === 'pending' ? (
                    <div className="flex gap-1 justify-end items-center">
                      <button
                        onClick={() => onProcessReport(report.id, 'reviewed')}
                        disabled={processingIds.includes(report.id)}
                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded border border-black/7 dark:border-white/10 disabled:opacity-50"
                        title="검토 완료 (문제없음)"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onProcessReport(report.id, 'dismissed')}
                        disabled={processingIds.includes(report.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-[#2D2D2D] rounded border border-black/7 dark:border-white/10 disabled:opacity-50"
                        title="신고 기각 (부당한 신고)"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>

                      <div className="relative action-menu">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onDropdownToggle(report.id, e.currentTarget as HTMLButtonElement);
                          }}
                          disabled={processingIds.includes(report.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded border border-black/7 dark:border-white/10 disabled:opacity-50 flex items-center transition-colors"
                          title="조치 실행"
                        >
                          <Trash2 className="w-4 h-4" />
                          <ChevronDown
                            className={`w-3 h-3 ml-1 transition-transform ${actionMenuOpen === report.id ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {report.reviewed_at && (
                        <div>처리일: {formatDate(report.reviewed_at) || '-'}</div>
                      )}
                      {report.reviewer && <div>처리자: {report.reviewer.nickname}</div>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

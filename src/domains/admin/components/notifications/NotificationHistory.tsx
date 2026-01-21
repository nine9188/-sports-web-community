'use client';

import { Clock, History } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import type { NotificationLog } from './types';

interface NotificationHistoryProps {
  logs: NotificationLog[];
  isLoading: boolean;
}

export function NotificationHistory({ logs, isLoading }: NotificationHistoryProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 border border-black/7 dark:border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          알림 발송 기록
        </h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">발송 기록 로딩 중...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>발송 기록이 없습니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/7 dark:border-white/10">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  발송 일시
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  관리자
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  모드
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  제목
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  내용
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  성공/실패
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2D2D2D]"
                >
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                    <div>
                      <p className="font-medium">{log.admin.nickname}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.admin.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        log.send_mode === 'all'
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}
                    >
                      {log.send_mode === 'all' ? '전체' : '선택'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                    <p className="font-medium truncate max-w-xs">{log.title}</p>
                    {log.link && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.link}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <p className="truncate max-w-xs">{log.message}</p>
                  </td>
                  <td className="py-3 px-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {log.total_sent}
                      </span>
                      {log.total_failed > 0 && (
                        <>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {log.total_failed}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

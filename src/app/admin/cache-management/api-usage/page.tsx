'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { getApiUsageSummary, getRecentApiLogs } from '@/domains/admin/actions/cacheManagement';

interface ApiLog {
  endpoint: string;
  params: Record<string, unknown> | null;
  status_code: number;
  remaining_daily: number | null;
  response_has_error: boolean;
  response_results: number;
  error_details: Record<string, unknown> | null;
  response_time_ms: number;
  created_at: string;
}

interface ApiSummary {
  totalCalls: number;
  errors: number;
  avgResponseMs: number;
  remainingDaily: number | null;
  byEndpoint: Record<string, number>;
}

export default function ApiUsagePage() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const [summaryResult, logsResult] = await Promise.all([
        getApiUsageSummary(),
        getRecentApiLogs(50, showErrorsOnly),
      ]);
      setSummary(summaryResult);
      if (logsResult.success) setLogs(logsResult.data);
      setIsLoading(false);
    }
    load();
  }, [showErrorsOnly]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">API 사용량</h1>

      {/* 오늘 요약 */}
      {summary && (
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">오늘 현황</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">{summary.totalCalls}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">총 호출</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${summary.remainingDaily && summary.remainingDaily < 1000 ? 'text-red-500' : 'text-green-600'}`}>
                {summary.remainingDaily?.toLocaleString() || '-'}
              </div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">잔여 할당량</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${summary.errors > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {summary.errors}
              </div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">에러</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">{summary.avgResponseMs}ms</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400">평균 응답</div>
            </div>
          </div>

          {/* 엔드포인트별 */}
          <div className="mt-4 pt-4 border-t border-black/7 dark:border-white/10">
            <div className="text-[13px] text-gray-500 dark:text-gray-400">
              <span className="font-medium">엔드포인트별: </span>
              {Object.entries(summary.byEndpoint)
                .sort(([, a], [, b]) => b - a)
                .map(([ep, count]) => (
                  <span key={ep} className="mr-3">{ep}: {count}</span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 로그 필터 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setShowErrorsOnly(false); setIsLoading(true); }}
          className={`px-3 py-1.5 rounded-lg text-[13px] ${
            !showErrorsOnly
              ? 'bg-gray-900 dark:bg-[#F0F0F0] text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => { setShowErrorsOnly(true); setIsLoading(true); }}
          className={`px-3 py-1.5 rounded-lg text-[13px] ${
            showErrorsOnly
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400'
          }`}
        >
          에러만
        </button>
      </div>

      {/* 로그 목록 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">시각</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">엔드포인트</th>
                <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 font-medium">상태</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-medium">응답</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-medium">잔여</th>
                <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-medium">결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {logs.map((log, i) => (
                <tr key={i} className={log.response_has_error ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(log.created_at).toLocaleTimeString('ko-KR')}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-[#F0F0F0] font-mono">
                    {log.endpoint}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {log.response_has_error ? (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <AlertTriangle className="w-3 h-3" /> 에러
                      </span>
                    ) : (
                      <span className="text-green-600">{log.status_code}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                    {log.response_time_ms}ms
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                    {log.remaining_daily?.toLocaleString() || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                    {log.response_results}건
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {showErrorsOnly ? '에러 없음' : '로그 없음'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/components/ui';
import { getApplicationLogs, getLogStatistics } from '@/shared/actions/log-actions';
import {
  LogStatisticsCards,
  LogFilters,
  LogList,
  type DatabaseLogEntry,
  type LogFilters as LogFiltersType,
  type LogStatistics,
  DEFAULT_FILTERS,
} from '@/domains/admin/components/logs';

export default function LogViewer() {
  const [logs, setLogs] = useState<DatabaseLogEntry[]>([]);
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<LogFiltersType>(DEFAULT_FILTERS);

  const limit = 50;

  // 로그 조회
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 빈 문자열 필터 제거
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));

      const response = await getApplicationLogs(page, limit, cleanFilters);

      setLogs(response.logs as DatabaseLogEntry[]);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그 조회 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [page, filters, limit]);

  // 통계 조회
  const fetchStatistics = async () => {
    try {
      const stats = await getLogStatistics('today');
      setStatistics(stats);
    } catch (err) {
      console.error('통계 조회 실패:', err);
    }
  };

  // 초기 로딩 및 필터 변경 시 조회
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 필터 변경 시 페이지를 1로 리셋
  const handleFilterChange = (key: keyof LogFiltersType, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  // 행 확장/축소 토글
  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <div className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchLogs}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 대시보드 */}
      {statistics && <LogStatisticsCards statistics={statistics} />}

      {/* 필터 영역 */}
      <LogFilters
        filters={filters}
        isLoading={loading}
        onFilterChange={handleFilterChange}
        onSearch={fetchLogs}
        onReset={resetFilters}
      />

      {/* 로그 목록 */}
      <LogList
        logs={logs}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        isLoading={loading}
        expandedRows={expandedRows}
        onToggleExpand={toggleExpanded}
        onPageChange={setPage}
      />
    </div>
  );
}

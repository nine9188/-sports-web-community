'use client';

import { Button } from '@/shared/components/ui';
import Spinner from '@/shared/components/Spinner';
import { LogEntryCard } from './LogEntryCard';
import type { DatabaseLogEntry } from './types';

interface LogListProps {
  logs: DatabaseLogEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function LogList({
  logs,
  totalCount,
  page,
  totalPages,
  isLoading,
  expandedRows,
  onToggleExpand,
  onPageChange,
}: LogListProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      <div className="p-4 border-b border-black/7 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0]">로그 목록 ({totalCount.toLocaleString()}개)</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">로그를 불러오는 중...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">조회된 로그가 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <LogEntryCard
                key={log.id}
                log={log}
                isExpanded={expandedRows.has(log.id)}
                onToggleExpand={() => onToggleExpand(log.id)}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
            >
              이전
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

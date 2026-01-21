'use client';

import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { badgeBaseStyles } from '@/shared/styles';
import { LEVEL_COLORS, CATEGORY_COLORS } from './constants';
import type { DatabaseLogEntry, LogLevel, LogCategory } from './types';

interface LogEntryCardProps {
  log: DatabaseLogEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function LogEntryCard({ log, isExpanded, onToggleExpand }: LogEntryCardProps) {
  return (
    <div className="border border-black/7 dark:border-white/10 rounded-lg p-4 hover:bg-[#F5F5F5] dark:hover:bg-[#2D2D2D]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(badgeBaseStyles, LEVEL_COLORS[log.level as LogLevel])}>{log.level}</span>
            <span className={cn(badgeBaseStyles, CATEGORY_COLORS[log.category as LogCategory])}>{log.category}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.action}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{log.message}</p>

          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            {log.user_id && <span>사용자: {log.profiles?.nickname || log.user_id}</span>}
            {log.ip_address && <span>IP: {log.ip_address}</span>}
            {log.endpoint && (
              <span>
                엔드포인트: {log.method} {log.endpoint}
              </span>
            )}
            {log.status_code && <span>상태: {log.status_code}</span>}
            {log.response_time_ms && <span>응답시간: {log.response_time_ms}ms</span>}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onToggleExpand} className="ml-2">
          {isExpanded ? '접기' : '펼치기'}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] rounded p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">기본 정보</h4>
              <div className="space-y-1">
                <div>
                  <span className="font-medium">ID:</span> {log.id}
                </div>
                <div>
                  <span className="font-medium">세션:</span> {log.session_id || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">요청 ID:</span> {log.request_id || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">User-Agent:</span> {log.user_agent || 'N/A'}
                </div>
              </div>
            </div>

            {(log.metadata || log.error_details || log.stack_trace) && (
              <div>
                <h4 className="font-medium mb-2">상세 정보</h4>
                {log.metadata && (
                  <div className="mb-2">
                    <span className="font-medium">메타데이터:</span>
                    <pre className="text-xs bg-white dark:bg-[#1D1D1D] p-2 rounded border border-black/7 dark:border-white/10 mt-1 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {log.error_details && (
                  <div className="mb-2">
                    <span className="font-medium text-red-600">에러 상세:</span>
                    <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 rounded border border-black/7 dark:border-white/10 mt-1 overflow-x-auto">
                      {JSON.stringify(log.error_details, null, 2)}
                    </pre>
                  </div>
                )}

                {log.stack_trace && (
                  <div>
                    <span className="font-medium text-red-600">스택 트레이스:</span>
                    <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 rounded border border-black/7 dark:border-white/10 mt-1 overflow-x-auto">
                      {log.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

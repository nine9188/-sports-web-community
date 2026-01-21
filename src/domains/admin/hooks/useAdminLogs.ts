'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getApplicationLogs,
  getLogStatistics,
  LogStatistics,
} from '@/shared/actions/log-actions';
import { adminKeys } from '@/shared/constants/queryKeys';

interface LogFilters {
  level?: string;
  category?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface LogEntry {
  id: string;
  level: string;
  category: string;
  action: string;
  message: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  response_time_ms?: number;
  metadata?: Record<string, unknown>;
  error_code?: string;
  error_details?: Record<string, unknown>;
  stack_trace?: string;
  created_at: string;
  profiles?: {
    nickname?: string;
    username?: string;
    email?: string;
  };
}

interface LogsResponse {
  logs: LogEntry[];
  totalPages: number;
  totalCount: number;
}

/**
 * 로그 목록 조회 훅
 */
export function useAdminLogs(
  page: number = 1,
  limit: number = 50,
  filters: LogFilters = {}
) {
  // 빈 문자열 필터 제거
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  );

  return useQuery<LogsResponse>({
    queryKey: adminKeys.logs(cleanFilters, page),
    queryFn: async () => {
      const response = await getApplicationLogs(page, limit, cleanFilters);
      return {
        logs: response.logs as LogEntry[],
        totalPages: response.totalPages,
        totalCount: response.totalCount,
      };
    },
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 로그 통계 조회 훅
 */
export function useLogStatistics(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery<LogStatistics>({
    queryKey: ['admin', 'logStatistics', period],
    queryFn: () => getLogStatistics(period),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

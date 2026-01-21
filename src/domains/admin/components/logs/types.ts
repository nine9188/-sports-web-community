import { LogLevel, LogCategory, LogStatistics } from '@/shared/actions/log-actions';

export type { LogLevel, LogCategory, LogStatistics };

// 데이터베이스 로그 엔트리 타입 (DB 응답용)
export interface DatabaseLogEntry {
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

export interface LogFilters {
  level: string;
  category: string;
  action: string;
  userId: string;
  startDate: string;
  endDate: string;
  search: string;
}

export const DEFAULT_FILTERS: LogFilters = {
  level: '',
  category: '',
  action: '',
  userId: '',
  startDate: '',
  endDate: '',
  search: '',
};

import { Tables, TablesInsert, TablesUpdate } from '@/shared/types/supabase';

// 신고 대상 타입
export type ReportTargetType = 'post' | 'comment' | 'user' | 'match_comment';

// 신고 상태 타입
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'resolved';

// 신고 사유 상수
export const REPORT_REASONS = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/비방',
  HATE: '혐오/차별',
  INAPPROPRIATE: '부적절한 내용',
  COPYRIGHT: '저작권 침해',
  PERSONAL_INFO: '개인정보 노출',
  OTHER: '기타'
} as const;

export type ReportReason = typeof REPORT_REASONS[keyof typeof REPORT_REASONS];

// 기본 신고 타입
export type Report = Tables<'reports'>;
export type ReportInsert = TablesInsert<'reports'>;
export type ReportUpdate = TablesUpdate<'reports'>;

// 신고 생성 요청 타입
export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

// 신고 응답 타입
export interface ReportResponse {
  success: boolean;
  error?: string;
  data?: Report | string | { message: string } | Record<string, unknown>;
}

// 관리자용 확장 신고 타입 (신고자 정보 포함)
export interface ReportWithReporter extends Report {
  reporter?: {
    id: string;
    nickname: string | null;
    email: string | null;
  };
  reviewer?: {
    id: string;
    nickname: string | null;
  } | null;
  target_info?: {
    title?: string;
    content?: string;
    author?: string;
  };
}

// 신고 목록 조회 파라미터
export interface GetReportsParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  limit?: number;
}

// 신고 처리 요청 타입
export interface ProcessReportRequest {
  reportId: string;
  status: 'reviewed' | 'dismissed' | 'resolved';
  adminNote?: string;
} 
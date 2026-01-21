'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReports,
  processReport,
  executeReportAction,
  restoreExpiredHiddenContent,
  getReportTargetAuthorId,
} from '@/domains/reports/actions';
import { ReportWithReporter, ReportStatus, ReportTargetType } from '@/domains/reports/types';
import { adminKeys } from '@/shared/constants/queryKeys';

interface ReportFilters {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

/**
 * 신고 목록 조회 훅
 */
export function useAdminReports(filters: ReportFilters = {}) {
  const queryFilters = {
    ...(filters.status && { status: filters.status }),
    ...(filters.targetType && { targetType: filters.targetType }),
  };

  return useQuery<ReportWithReporter[]>({
    queryKey: adminKeys.reports(queryFilters),
    queryFn: () => getReports(queryFilters),
    staleTime: 1000 * 60 * 2, // 2분
  });
}

/**
 * 신고 처리 (상태 변경) mutation
 */
export function useProcessReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: 'reviewed' | 'dismissed' | 'resolved';
    }) => {
      const result = await processReport({ reportId, status });
      if (!result.success) {
        throw new Error(result.error || '신고 처리 중 오류가 발생했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

/**
 * 신고 조치 실행 mutation (삭제, 숨김, 정지)
 */
export function useExecuteReportActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      action,
      suspendDays,
    }: {
      reportId: string;
      action: 'delete' | 'hide' | 'suspend_user' | 'suspend_author';
      suspendDays?: number;
    }) => {
      const result = await executeReportAction(reportId, action, suspendDays);
      if (!result.success) {
        throw new Error(result.error || '조치 실행 중 오류가 발생했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

/**
 * 숨김 콘텐츠 자동 복구 mutation
 */
export function useRestoreHiddenContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await restoreExpiredHiddenContent();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

/**
 * 신고 대상 작성자 ID 조회
 */
export function useGetReportTargetAuthor() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const result = await getReportTargetAuthorId(reportId);
      if (!result.success) {
        throw new Error(result.error || '작성자 정보를 가져오는데 실패했습니다.');
      }
      return result;
    },
  });
}

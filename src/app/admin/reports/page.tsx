'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getReports,
  processReport,
  executeReportAction,
  restoreExpiredHiddenContent,
  getReportTargetAuthorId,
} from '@/domains/reports/actions';
import {
  ReportFilters,
  ReportTable,
  ActionDropdownMenu,
  SuspensionModal,
  calculateDropdownPosition,
  estimateDropdownHeight,
  getActionConfirmMessage,
  getStatusText,
  type ReportWithReporter,
  type ReportStatus,
  type ReportTargetType,
  type SelectedAuthor,
  type DropdownPosition,
  type ActionType,
} from '@/domains/admin/components/reports';

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>('all');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  // 작성자 정지 모달 관련 상태
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<SelectedAuthor | null>(null);

  // 신고 목록 불러오기
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { targetType: typeFilter }),
      };
      const data = await getReports(params);
      setReports(data);
    } catch (error) {
      console.error('신고 목록 조회 오류:', error);
      toast.error('신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuOpen && !(event.target as Element).closest('.action-menu')) {
        setActionMenuOpen(null);
        setDropdownPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuOpen]);

  // 드롭다운 위치 계산 및 토글
  const handleDropdownToggle = (reportId: string, buttonElement: HTMLButtonElement) => {
    if (actionMenuOpen === reportId) {
      setActionMenuOpen(null);
      setDropdownPosition(null);
    } else {
      const report = reports.find((r) => r.id === reportId);
      const estimatedHeight = report ? estimateDropdownHeight(report.target_type) : 100;
      const position = calculateDropdownPosition(buttonElement, estimatedHeight);
      setDropdownPosition(position);
      setActionMenuOpen(reportId);
    }
  };

  // 신고 처리 (상태만 변경)
  const handleProcessReport = async (
    reportId: string,
    status: 'reviewed' | 'dismissed' | 'resolved'
  ) => {
    try {
      setProcessingIds((prev) => [...prev, reportId]);
      const result = await processReport({ reportId, status });
      if (result.success) {
        toast.success(`신고가 ${getStatusText(status)}되었습니다.`);
        await fetchReports();
      } else {
        toast.error(result.error || '신고 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('신고 처리 오류:', error);
      toast.error('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== reportId));
    }
  };

  // 실제 조치 실행
  const handleExecuteAction = async (action: ActionType, suspendDays?: number) => {
    if (!actionMenuOpen) return;

    const confirmMessage = getActionConfirmMessage(action, suspendDays);
    if (!confirm(confirmMessage)) return;

    const reportId = actionMenuOpen;
    try {
      setProcessingIds((prev) => [...prev, reportId]);
      setActionMenuOpen(null);
      setDropdownPosition(null);

      const result = await executeReportAction(reportId, action, suspendDays);
      if (result.success) {
        toast.success((result.data as { message?: string })?.message || '조치가 완료되었습니다.');
        await fetchReports();
      } else {
        toast.error(result.error || '조치 실행 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('조치 실행 오류:', error);
      toast.error('조치 실행 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== reportId));
    }
  };

  // 자동 복구 실행
  const handleAutoRestore = async () => {
    if (!confirm('7일이 지난 숨김 처리된 콘텐츠를 자동으로 복구하시겠습니까?')) return;

    try {
      setIsLoading(true);
      const result = await restoreExpiredHiddenContent();
      if (result.success) {
        toast.success(result.message);
        await fetchReports();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('자동 복구 오류:', error);
      toast.error('자동 복구 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 작성자 정지 모달 열기
  const openAuthorSuspensionModal = async () => {
    if (!actionMenuOpen) return;

    try {
      const report = reports.find((r) => r.id === actionMenuOpen);
      if (!report) return;

      const result = await getReportTargetAuthorId(actionMenuOpen);
      if (!result.success) {
        toast.error(result.error || '작성자 정보를 가져오는데 실패했습니다.');
        return;
      }

      const authorNickname = report.target_info?.author || '알 수 없는 사용자';
      setSelectedAuthor({
        id: result.authorId!,
        nickname: authorNickname,
        reportId: actionMenuOpen,
      });
      setShowSuspensionModal(true);
      setActionMenuOpen(null);
      setDropdownPosition(null);
    } catch (error) {
      console.error('작성자 정지 모달 열기 오류:', error);
      toast.error('작성자 정보를 가져오는데 실패했습니다.');
    }
  };

  // 정지 처리 완료 후 콜백
  const handleSuspensionUpdate = async () => {
    if (selectedAuthor?.reportId) {
      try {
        const result = await processReport({
          reportId: selectedAuthor.reportId,
          status: 'resolved',
        });
        if (result.success) {
          toast.success('작성자 정지 처리가 완료되었습니다.');
        } else {
          toast.error('신고 상태 업데이트에 실패했습니다.');
        }
      } catch (error) {
        console.error('신고 상태 업데이트 오류:', error);
        toast.error('신고 상태 업데이트 중 오류가 발생했습니다.');
      }
    }
    setShowSuspensionModal(false);
    setSelectedAuthor(null);
    await fetchReports();
  };

  const activeReport = actionMenuOpen ? reports.find((r) => r.id === actionMenuOpen) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">신고 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          사용자 신고 내역을 확인하고 처리할 수 있습니다.
        </p>
      </div>

      <ReportFilters
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        isLoading={isLoading}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onRefresh={fetchReports}
        onAutoRestore={handleAutoRestore}
      />

      <ReportTable
        reports={reports}
        isLoading={isLoading}
        processingIds={processingIds}
        actionMenuOpen={actionMenuOpen}
        onProcessReport={handleProcessReport}
        onDropdownToggle={handleDropdownToggle}
      />

      {/* Portal로 렌더링되는 드롭다운 */}
      {actionMenuOpen && dropdownPosition && activeReport && typeof window !== 'undefined' && (
        <ActionDropdownMenu
          report={activeReport}
          position={dropdownPosition}
          onAction={handleExecuteAction}
          onOpenAuthorSuspension={openAuthorSuspensionModal}
        />
      )}

      {/* 작성자 정지 관리 모달 */}
      <SuspensionModal
        isOpen={showSuspensionModal}
        onClose={() => setShowSuspensionModal(false)}
        selectedAuthor={selectedAuthor}
        onUpdate={handleSuspensionUpdate}
      />
    </div>
  );
}

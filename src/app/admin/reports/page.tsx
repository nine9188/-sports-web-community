'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter,
  Trash2,
  EyeOff,
  UserX,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getReports, processReport, executeReportAction, restoreExpiredHiddenContent, getReportTargetAuthorId } from '@/domains/reports/actions';
import { ReportWithReporter, ReportStatus, ReportTargetType } from '@/domains/reports/types';
import SuspensionManager from '@/domains/admin/components/SuspensionManager';
import { formatDate } from '@/shared/utils/date';
import Spinner from '@/shared/components/Spinner';
import { Button } from '@/shared/components/ui';

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>('all');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  
  // 작성자 정지 모달 관련 상태
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<{ id: string; nickname: string; reportId: string } | null>(null);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);

  // 드롭다운 위치 계산 및 토글
  const handleDropdownToggle = (reportId: string, buttonElement: HTMLButtonElement) => {
    if (actionMenuOpen === reportId) {
      setActionMenuOpen(null);
      setDropdownPosition(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      const dropdownWidth = 208; // 드롭다운 너비
      
      // 드롭다운 내용에 따른 높이 계산
      const report = reports.find(r => r.id === reportId);
      let estimatedHeight = 100; // 기본 높이
      
      if (report) {
        // 콘텐츠 조치 (2개 항목) + 작성자 정지 (1개 항목) = 약 200px
        if (report.target_type === 'post' || report.target_type === 'comment' || report.target_type === 'match_comment') {
          estimatedHeight = 250;
        }
        // 사용자 정지 (3개 항목) = 약 200px
        else if (report.target_type === 'user') {
          estimatedHeight = 200;
        }
      }
      
      // 최대 높이 제한 (max-h-96 = 384px)
      const dropdownHeight = Math.min(estimatedHeight, 384);
      
      // 화면 크기 가져오기
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 기본 위치 계산
      let left = rect.right + window.scrollX - dropdownWidth;
      let top = rect.bottom + window.scrollY + 8;
      
      // 오른쪽으로 넘어가는 경우 왼쪽으로 이동
      if (left < 10) {
        left = rect.left + window.scrollX;
      }
      
      // 화면 오른쪽 끝을 넘어가는 경우
      if (left + dropdownWidth > viewportWidth - 10) {
        left = viewportWidth - dropdownWidth - 10;
      }
      
      // 아래쪽으로 넘어가는 경우 위쪽에 표시
      if (top + dropdownHeight > viewportHeight + window.scrollY - 10) {
        top = rect.top + window.scrollY - dropdownHeight - 8;
        
        // 위쪽에도 공간이 없으면 화면 내에서 최대한 위쪽에 표시
        if (top < window.scrollY + 10) {
          top = window.scrollY + 10;
        }
      }
      
      setDropdownPosition({ top, left });
      setActionMenuOpen(reportId);
    }
  };

  // 신고 처리 (상태만 변경)
  const handleProcessReport = async (
    reportId: string, 
    status: 'reviewed' | 'dismissed' | 'resolved'
  ) => {
    try {
      setProcessingIds(prev => [...prev, reportId]);
      
      const result = await processReport({ reportId, status });
      
      if (result.success) {
        toast.success(`신고가 ${getStatusText(status)}되었습니다.`);
        await fetchReports(); // 목록 새로고침
      } else {
        toast.error(result.error || '신고 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('신고 처리 오류:', error);
      toast.error('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== reportId));
    }
  };

  // 실제 조치 실행
  const handleExecuteAction = async (
    reportId: string,
    action: 'delete' | 'hide' | 'suspend_user' | 'suspend_author',
    suspendDays?: number
  ) => {
    const confirmMessage = getActionConfirmMessage(action, suspendDays);
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingIds(prev => [...prev, reportId]);
      setActionMenuOpen(null);
      setDropdownPosition(null);
      
      const result = await executeReportAction(reportId, action, suspendDays);
      
      if (result.success) {
        toast.success((result.data as { message?: string })?.message || '조치가 완료되었습니다.');
        await fetchReports(); // 목록 새로고침
      } else {
        toast.error(result.error || '조치 실행 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('조치 실행 오류:', error);
      toast.error('조치 실행 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== reportId));
    }
  };

  // 자동 복구 실행
  const handleAutoRestore = async () => {
    if (!confirm('7일이 지난 숨김 처리된 콘텐츠를 자동으로 복구하시겠습니까?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await restoreExpiredHiddenContent();
      
      if (result.success) {
        toast.success(result.message);
        await fetchReports(); // 목록 새로고침
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
  const openAuthorSuspensionModal = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // 실제 작성자 ID 가져오기
      const result = await getReportTargetAuthorId(reportId);
      if (!result.success) {
        toast.error(result.error || '작성자 정보를 가져오는데 실패했습니다.');
        return;
      }

      // 작성자 정보 설정
      const authorNickname = report.target_info?.author || '알 수 없는 사용자';
      
      setSelectedAuthor({
        id: result.authorId!,
        nickname: authorNickname,
        reportId: reportId
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
        // 신고를 해결됨으로 처리
        const result = await processReport({ 
          reportId: selectedAuthor.reportId, 
          status: 'resolved' 
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

  const getActionConfirmMessage = (action: string, suspendDays?: number) => {
    switch (action) {
      case 'delete':
        return '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';
      case 'hide':
        return '해당 내용을 숨김 처리하시겠습니까?';
      case 'suspend_user':
        return `사용자를 ${suspendDays || 7}일간 정지시키겠습니까?`;
      case 'suspend_author':
        return `작성자를 ${suspendDays || 7}일간 정지시키겠습니까?`;
      default:
        return '이 작업을 실행하시겠습니까?';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기 중';
      case 'reviewed': return '검토 완료';
      case 'dismissed': return '기각';
      case 'resolved': return '해결';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      dismissed: 'bg-gray-100 text-gray-800',
      resolved: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusText(status)}
      </span>
    );
  };

  const getTargetTypeText = (type: string) => {
    switch (type) {
      case 'post': return '게시글';
      case 'comment': return '댓글';
      case 'user': return '사용자';
      case 'match_comment': return '응원 댓글';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">신고 관리</h1>
        <p className="text-gray-600">사용자 신고 내역을 확인하고 처리할 수 있습니다.</p>
      </div>

      {/* 필터 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">필터:</span>
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기 중</option>
            <option value="reviewed">검토 완료</option>
            <option value="dismissed">기각</option>
            <option value="resolved">해결</option>
          </select>

          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as ReportTargetType | 'all')}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 유형</option>
            <option value="post">게시글</option>
            <option value="comment">댓글</option>
            <option value="user">사용자</option>
            <option value="match_comment">응원 댓글</option>
          </select>

          <Button
            variant="outline"
            onClick={fetchReports}
            disabled={isLoading}
            className="px-3 py-2"
          >
            새로고침
          </Button>

          <Button
            variant="outline"
            onClick={handleAutoRestore}
            disabled={isLoading}
            className="px-3 py-2 border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 flex items-center gap-2"
            title="7일이 지난 숨김 처리된 콘텐츠를 자동으로 복구합니다"
          >
            <RefreshCw className="w-4 h-4" />
            자동 복구
          </Button>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-gray-50 rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">신고 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신고 정보
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신고자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신고일
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reason}
                        </div>
                        {report.description && (
                          <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700">
                            {getTargetTypeText(report.target_type)}
                          </span>
                        </div>
                        {report.target_info && (
                          <div className="text-sm text-gray-500 mt-1 max-w-xs">
                            <div className="truncate">
                              {report.target_info.title || report.target_info.content}
                            </div>
                            <div className="text-xs text-gray-400">
                              작성자: {report.target_info.author}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {report.reporter?.nickname || report.reporter?.email || '알 수 없음'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(report.created_at) || '-'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {report.status === 'pending' && (
                        <div className="flex gap-1 justify-end items-center">
                          <button
                            onClick={() => handleProcessReport(report.id, 'reviewed')}
                            disabled={processingIds.includes(report.id)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-gray-300 disabled:opacity-50"
                            title="검토 완료 (문제없음)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleProcessReport(report.id, 'dismissed')}
                            disabled={processingIds.includes(report.id)}
                            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-300 disabled:opacity-50"
                            title="신고 기각 (부당한 신고)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          
                          {/* 실제 조치 드롭다운 */}
                          <div className="relative action-menu">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDropdownToggle(report.id, e.currentTarget as HTMLButtonElement);
                              }}
                              disabled={processingIds.includes(report.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-gray-300 disabled:opacity-50 flex items-center transition-colors"
                              title="조치 실행"
                            >
                              <Trash2 className="w-4 h-4" />
                              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${actionMenuOpen === report.id ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                      )}
                      {report.status !== 'pending' && (
                        <div className="text-xs text-gray-500">
                          {report.reviewed_at && (
                            <div>처리일: {formatDate(report.reviewed_at) || '-'}</div>
                          )}
                          {report.reviewer && (
                            <div>처리자: {report.reviewer.nickname}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portal로 렌더링되는 드롭다운 */}
      {actionMenuOpen && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden action-menu max-h-96 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <div className="py-2">
            {/* 게시글/댓글/응원댓글 조치 */}
            {reports.find(r => r.id === actionMenuOpen) && 
             (reports.find(r => r.id === actionMenuOpen)!.target_type === 'post' || 
              reports.find(r => r.id === actionMenuOpen)!.target_type === 'comment' || 
              reports.find(r => r.id === actionMenuOpen)!.target_type === 'match_comment') && (
              <>
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  콘텐츠 조치
                </div>
                <button
                  onClick={() => handleExecuteAction(actionMenuOpen, 'delete')}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">완전 삭제</div>
                    <div className="text-xs text-gray-500">되돌릴 수 없습니다</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExecuteAction(actionMenuOpen, 'hide')}
                  className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 flex items-center transition-colors"
                >
                  <EyeOff className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">숨김 처리</div>
                    <div className="text-xs text-gray-500">복구 가능합니다</div>
                  </div>
                </button>
              </>
            )}
            
            {/* 사용자 정지 조치 */}
            {reports.find(r => r.id === actionMenuOpen)?.target_type === 'user' && (
              <>
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  사용자 정지
                </div>
                <button
                  onClick={() => handleExecuteAction(actionMenuOpen, 'suspend_user', 3)}
                  className="w-full text-left px-4 py-3 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center transition-colors"
                >
                  <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">3일 정지</div>
                    <div className="text-xs text-gray-500">경고 수준</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExecuteAction(actionMenuOpen, 'suspend_user', 7)}
                  className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 flex items-center transition-colors"
                >
                  <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">7일 정지</div>
                    <div className="text-xs text-gray-500">일반 제재</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExecuteAction(actionMenuOpen, 'suspend_user', 30)}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                >
                  <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">30일 정지</div>
                    <div className="text-xs text-gray-500">강력 제재</div>
                  </div>
                </button>
              </>
            )}
            
            {/* 작성자 정지 옵션 */}
            {reports.find(r => r.id === actionMenuOpen) && 
             (reports.find(r => r.id === actionMenuOpen)!.target_type === 'post' || 
              reports.find(r => r.id === actionMenuOpen)!.target_type === 'comment' || 
              reports.find(r => r.id === actionMenuOpen)!.target_type === 'match_comment') && (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자 정지
                  </div>
                  <button
                    onClick={() => openAuthorSuspensionModal(actionMenuOpen)}
                    className="w-full text-left px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 flex items-center transition-colors"
                  >
                    <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">작성자 정지 관리</div>
                      <div className="text-xs text-gray-500">정지 기간과 사유를 설정합니다</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 작성자 정지 관리 모달 */}
      {showSuspensionModal && selectedAuthor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  작성자 정지 관리
                </h3>
                <button
                  onClick={() => setShowSuspensionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <SuspensionManager
                userId={selectedAuthor.id}
                userNickname={selectedAuthor.nickname}
                currentSuspension={{
                  is_suspended: false,
                  suspended_until: null,
                  suspended_reason: null
                }}
                onUpdate={handleSuspensionUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
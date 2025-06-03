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
import { getReports, processReport, executeReportAction, restoreExpiredHiddenContent } from '@/domains/reports/actions';
import { ReportWithReporter, ReportStatus, ReportTargetType } from '@/domains/reports/types';

export default function ReportsAdminPage() {
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>('all');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

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
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 208 // 드롭다운 너비(52*4=208px)만큼 왼쪽으로
      });
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
    action: 'delete' | 'hide' | 'suspend_user',
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

  const getActionConfirmMessage = (action: string, suspendDays?: number) => {
    switch (action) {
      case 'delete':
        return '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';
      case 'hide':
        return '해당 내용을 숨김 처리하시겠습니까?';
      case 'suspend_user':
        return `사용자를 ${suspendDays || 7}일간 정지시키겠습니까?`;
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

          <button 
            onClick={fetchReports}
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            새로고침
          </button>

          <button 
            onClick={handleAutoRestore}
            disabled={isLoading}
            className="px-3 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center gap-2"
            title="7일이 지난 숨김 처리된 콘텐츠를 자동으로 복구합니다"
          >
            <RefreshCw className="w-4 h-4" />
            자동 복구
          </button>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-gray-50 rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
                      {formatDate(report.created_at)}
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
                            <div>처리일: {formatDate(report.reviewed_at)}</div>
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
          className="fixed w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden action-menu"
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
                    onClick={() => {
                      setActionMenuOpen(null);
                      setDropdownPosition(null);
                      toast.info('작성자 정지 기능은 개발 중입니다.');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 flex items-center transition-colors"
                  >
                    <UserX className="w-4 h-4 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">작성자 7일 정지</div>
                      <div className="text-xs text-gray-500">개발 예정</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 
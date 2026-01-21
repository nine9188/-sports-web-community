'use client';

import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select-radix';
import type { ReportStatus, ReportTargetType } from './types';

interface ReportFiltersProps {
  statusFilter: ReportStatus | 'all';
  typeFilter: ReportTargetType | 'all';
  isLoading: boolean;
  onStatusFilterChange: (value: ReportStatus | 'all') => void;
  onTypeFilterChange: (value: ReportTargetType | 'all') => void;
  onRefresh: () => void;
  onAutoRestore: () => void;
}

export function ReportFilters({
  statusFilter,
  typeFilter,
  isLoading,
  onStatusFilterChange,
  onTypeFilterChange,
  onRefresh,
  onAutoRestore,
}: ReportFiltersProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 border border-black/7 dark:border-white/10">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">필터:</span>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusFilterChange(value as ReportStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="전체 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기 중</SelectItem>
            <SelectItem value="reviewed">검토 완료</SelectItem>
            <SelectItem value="dismissed">기각</SelectItem>
            <SelectItem value="resolved">해결</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => onTypeFilterChange(value as ReportTargetType | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="전체 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="post">게시글</SelectItem>
            <SelectItem value="comment">댓글</SelectItem>
            <SelectItem value="user">사용자</SelectItem>
            <SelectItem value="match_comment">응원 댓글</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-2"
        >
          새로고침
        </Button>

        <Button
          variant="outline"
          onClick={onAutoRestore}
          disabled={isLoading}
          className="px-3 py-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 flex items-center gap-2"
          title="7일이 지난 숨김 처리된 콘텐츠를 자동으로 복구합니다"
        >
          <RefreshCw className="w-4 h-4" />
          자동 복구
        </Button>
      </div>
    </div>
  );
}

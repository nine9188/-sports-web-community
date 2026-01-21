'use client';

import {
  Button,
  SelectRadix as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui';
import type { LogFilters as LogFiltersType } from './types';

interface LogFiltersProps {
  filters: LogFiltersType;
  isLoading: boolean;
  onFilterChange: (key: keyof LogFiltersType, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function LogFilters({ filters, isLoading, onFilterChange, onSearch, onReset }: LogFiltersProps) {
  const inputClassName =
    'h-10 w-full rounded-md px-3 py-2 text-sm bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400';

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
      <div className="p-4 border-b border-black/7 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-[#F0F0F0]">필터</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Select
            value={filters.level || 'all'}
            onValueChange={(value) => onFilterChange('level', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="레벨" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 레벨</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="FATAL">FATAL</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onFilterChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              <SelectItem value="auth">인증</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="database">데이터베이스</SelectItem>
              <SelectItem value="user_action">사용자 액션</SelectItem>
              <SelectItem value="system">시스템</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
              <SelectItem value="security">보안</SelectItem>
            </SelectContent>
          </Select>

          <input
            className={inputClassName}
            placeholder="액션"
            value={filters.action}
            onChange={(e) => onFilterChange('action', e.target.value)}
          />

          <input
            className={inputClassName}
            placeholder="사용자 ID"
            value={filters.userId}
            onChange={(e) => onFilterChange('userId', e.target.value)}
          />

          <input
            className={inputClassName}
            type="datetime-local"
            placeholder="시작 날짜"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
          />

          <input
            className={inputClassName}
            type="datetime-local"
            placeholder="종료 날짜"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
          />

          <input
            className={inputClassName}
            placeholder="검색"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onSearch} disabled={isLoading}>
            {isLoading ? '조회 중...' : '조회'}
          </Button>
          <Button variant="outline" onClick={onReset}>
            필터 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

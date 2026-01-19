'use client';

import React from 'react';
import { ExpHistoryItem } from '@/domains/settings/types';
import { formatDate } from '@/domains/settings/hooks';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

interface ExpHistoryProps {
  expHistory: ExpHistoryItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 경험치 내역 컴포넌트
 * 사용자의 경험치 획득/사용 내역을 테이블 형태로 보여줍니다.
 */
export default function ExpHistory({ expHistory = [], isLoading, error }: ExpHistoryProps) {
  const isEmpty = expHistory.length === 0;

  if (isLoading) {
    return <div className="text-center py-4 text-gray-700 dark:text-gray-300">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500 dark:text-red-400">오류가 발생했습니다.</div>;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader className="h-auto py-3">
        <ContainerTitle>경험치 내역</ContainerTitle>
      </ContainerHeader>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <ExpHistoryTable expHistory={expHistory} />
      )}
    </Container>
  );
}

/**
 * 경험치 내역이 없을 때 표시할 컴포넌트
 */
function EmptyState() {
  return (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      <p>경험치 내역이 없습니다.</p>
    </div>
  );
}

interface ExpHistoryTableProps {
  expHistory: ExpHistoryItem[];
}

/**
 * 경험치 내역 테이블 컴포넌트
 */
function ExpHistoryTable({ expHistory }: ExpHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
        <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              날짜
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              활동 내용
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              경험치
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
          {expHistory.map((item) => (
            <ExpHistoryRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ExpHistoryRowProps {
  item: ExpHistoryItem;
}

/**
 * 개별 경험치 내역 행 컴포넌트
 */
function ExpHistoryRow({ item }: ExpHistoryRowProps) {
  // formatDate 유틸리티 함수 사용
  const formattedDate = formatDate(item.created_at);

  // 음수면 spend, 양수면 earn으로 처리
  const isEarned = item.amount >= 0;
  const prefix = isEarned ? '+' : '';
  const expAmount = Math.abs(item.amount || 0);

  return (
    <tr className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
        {item.reason || '경험치 획득'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 dark:text-[#F0F0F0]">
        {prefix}{expAmount.toLocaleString()} XP
      </td>
    </tr>
  );
}

'use client';

import React from 'react';
import { PointHistoryItem } from '../../actions/points';
import { formatDate } from '@/shared/utils/date';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

interface PointHistoryProps {
  pointHistory: PointHistoryItem[];
}

export default function PointHistory({ pointHistory = [] }: PointHistoryProps) {

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader className="h-auto py-3">
        <ContainerTitle>포인트 내역</ContainerTitle>
      </ContainerHeader>

      {pointHistory.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <p>포인트 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  날짜
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  내용
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
              {pointHistory.map((item) => (
                <tr key={item.id} className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.created_at) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                    {item.reason || '포인트 내역'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 dark:text-[#F0F0F0]">
                    {item.type === 'earn' ? '+' : '-'}{Math.abs(item.points || 0).toLocaleString()} P
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}

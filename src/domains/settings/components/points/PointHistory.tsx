'use client';

import React from 'react';
import { PointHistoryItem } from '../../actions/points';

interface PointHistoryProps {
  pointHistory: PointHistoryItem[];
}

export default function PointHistory({ pointHistory = [] }: PointHistoryProps) {
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 시간 차이 계산 (밀리초)
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      // 시간 차이에 따른 표시
      if (diffSec < 60) {
        return '방금 전';
      } else if (diffMin < 60) {
        return `${diffMin}분 전`;
      } else if (diffHour < 24) {
        return `${diffHour}시간 전`;
      } else if (diffDay < 7) {
        return `${diffDay}일 전`;
      } else {
        // YYYY-MM-DD 형식으로 표시
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      return dateString || '-';
    }
  };
  
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-base font-medium text-gray-900">포인트 내역</h3>
      </div>
      
      {pointHistory.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>포인트 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pointHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.created_at || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.reason || '포인트 내역'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                    item.type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.type === 'earn' ? '+' : '-'}{Math.abs(item.points || 0).toLocaleString()} P
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
'use client';

import React from 'react';
import { PointHistoryItem } from '../../actions/points';
import { formatDate } from '@/shared/utils/date';

interface PointHistoryProps {
  pointHistory: PointHistoryItem[];
}

export default function PointHistory({ pointHistory = [] }: PointHistoryProps) {

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
                    {formatDate(item.created_at) || '-'}
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

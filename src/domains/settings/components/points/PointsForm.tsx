'use client';

import React from 'react';
import RewardGuide from '@/shared/components/RewardGuide';

interface PointsFormProps {
  userPoints: number;
}

export default function PointsForm({
  userPoints = 0,
}: PointsFormProps) {
  return (
    <div>
      {/* 현재 포인트 정보 */}
      <div className="bg-white dark:bg-[#1D1D1D]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 md:mb-0">보유 포인트</h3>

          <div className="flex items-center">
            <span className="text-lg font-bold mr-2 text-gray-900 dark:text-[#F0F0F0]">{userPoints.toLocaleString()}</span>
            <span className="text-gray-700 dark:text-gray-300">P</span>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/10">
        </div>
      </div>

      {/* 포인트 획득 안내 */}
      <RewardGuide type="points" />
    </div>
  );
}

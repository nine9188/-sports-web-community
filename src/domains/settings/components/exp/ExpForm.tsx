'use client';

import React from 'react';
import {
  getExpForNextLevel,
  calculateLevelProgress,
  getExpToNextLevel
} from '@/shared/utils/level-icons';
import RewardGuide from '@/shared/components/RewardGuide';

interface ExpFormProps {
  userId: string;
  userExp: number;
  userLevel: number;
}

/**
 * 경험치 정보 표시 컴포넌트
 * 사용자의 현재 레벨, 경험치 및 다음 레벨까지 필요한 경험치를 보여줍니다.
 */
export default function ExpForm({
  userExp = 0,
  userLevel = 1
}: ExpFormProps) {
  // 현재 레벨의 진행률 계산
  const progressPercentage = calculateLevelProgress(userLevel, userExp);

  // 다음 레벨까지 남은 경험치 계산
  const remainingExp = getExpToNextLevel(userLevel, userExp);

  // 다음 레벨에 필요한 총 경험치 계산
  const nextLevelTotalExp = getExpForNextLevel(userLevel);

  return (
    <div>
      {/* 현재 레벨 및 경험치 정보 */}
      <div className="bg-white dark:bg-[#1D1D1D]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 md:mb-0">현재 레벨</h3>

          <div className="flex items-center">
            <div className="text-lg font-bold mr-2 text-gray-900 dark:text-[#F0F0F0]">
              {userLevel}
            </div>
            <span className="text-gray-700 dark:text-gray-300">Lv.</span>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/10 pt-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">경험치</span>
            <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
              {userExp.toLocaleString()} / {nextLevelTotalExp.toLocaleString()} XP
            </span>
          </div>

          {/* 경험치 진행 바 */}
          <div className="w-full bg-[#F5F5F5] dark:bg-[#262626] rounded-full h-2.5">
            <div
              className="bg-[#262626] dark:bg-[#F0F0F0] h-2.5 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            다음 레벨까지 {remainingExp.toLocaleString()} XP 필요
          </p>
        </div>
      </div>

      {/* 경험치 획득 안내 */}
      <RewardGuide type="exp" />
    </div>
  );
}

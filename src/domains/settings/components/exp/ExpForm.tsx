'use client';

import React from 'react';
import {
  getExpForNextLevel,
  calculateLevelProgress,
  getExpToNextLevel
} from '@/shared/utils/level-icons';

// 활동 보상 상수 정의
const ACTIVITY_REWARDS = {
  POST_CREATION: { exp: 25, points: 5 },
  COMMENT_CREATION: { exp: 5, points: 1 },
  RECEIVED_LIKE: { exp: 5, points: 1 },
  DAILY_LOGIN: { exp: 30, points: 5 },
  CONSECUTIVE_LOGIN: { exp: 30, points: 5 }
} as const;

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

  // 현재 레벨의 총 필요 경험치 계산
  const nextLevelTotalExp = getExpForNextLevel(userLevel);

  // 현재 레벨에서 획득한 경험치 계산
  const currentLevelExp = userExp - (userLevel > 1 ? getExpForNextLevel(userLevel - 1) : 0);

  return (
    <div>
      {/* 현재 레벨 및 경험치 정보 */}
      <div className="bg-white dark:bg-[#1D1D1D]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0] mb-2 md:mb-0">현재 레벨</h3>

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
              {currentLevelExp.toLocaleString()} / {nextLevelTotalExp.toLocaleString()} XP
            </span>
          </div>

          {/* 경험치 진행 바 */}
          <div className="w-full bg-[#F5F5F5] dark:bg-[#262626] rounded-full h-2.5">
            <div
              className="bg-slate-800 dark:bg-[#F0F0F0] h-2.5 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            다음 레벨까지 {remainingExp.toLocaleString()} XP 필요
          </p>
        </div>
      </div>

      {/* 경험치 획득 안내 */}
      <ExpRewardsGuide />
    </div>
  );
}

/**
 * 경험치 획득 방법을 안내하는 컴포넌트
 * 책임 분리를 통해 코드 가독성 향상
 */
function ExpRewardsGuide() {
  return (
    <div className="p-0 mt-4">
      <h3 className="font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">경험치 획득 방법</h3>
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
        다양한 활동을 통해 경험치를 획득하고 레벨을 올릴 수 있습니다.
      </p>
      <div className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg p-4">
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <RewardItem
            type="POST_CREATION"
            description="게시글 작성"
            dailyLimit={5}
          />
          <RewardItem
            type="COMMENT_CREATION"
            description="댓글 작성"
            dailyLimit={5}
          />
          <RewardItem
            type="RECEIVED_LIKE"
            description="추천 받기"
            dailyLimit={10}
          />
          <RewardItem
            type="DAILY_LOGIN"
            description="하루 최초 로그인"
          />
          <RewardItem
            type="CONSECUTIVE_LOGIN"
            description="연속 출석 보너스"
          />
        </ul>
      </div>
    </div>
  );
}

interface RewardItemProps {
  type: keyof typeof ACTIVITY_REWARDS;
  description: string;
  dailyLimit?: number;
}

/**
 * 개별 경험치 보상 항목 컴포넌트
 * 각 보상 항목을 더 읽기 쉽게 표시
 */
function RewardItem({ type, description, dailyLimit }: RewardItemProps) {
  const reward = ACTIVITY_REWARDS[type];

  return (
    <li className="flex items-start">
      <span className="mr-2 text-gray-900 dark:text-[#F0F0F0]">•</span>
      <span>
        {description} - {reward.exp} XP
        {dailyLimit && ` (하루 ${reward.exp * dailyLimit}XP 제한)`}
      </span>
    </li>
  );
}

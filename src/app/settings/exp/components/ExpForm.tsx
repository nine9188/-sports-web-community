'use client';

import React from 'react';
import { 
  getExpForNextLevel,
  calculateLevelProgress,
  getExpToNextLevel
} from '@/app/utils/level-icons';

// 직접 활동 보상 정보 정의
const ACTIVITY_REWARDS = {
  POST_CREATION: { exp: 25, points: 5 },
  COMMENT_CREATION: { exp: 5, points: 1 },
  RECEIVED_LIKE: { exp: 5, points: 1 },
  DAILY_LOGIN: { exp: 30, points: 5 },
  CONSECUTIVE_LOGIN: { exp: 30, points: 5 }
};

interface ExpFormProps {
  userId: string;
  userExp: number;
  userLevel: number;
}

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
    <div className="space-y-6">
      {/* 현재 레벨 및 경험치 정보 */}
      <div className="bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-2 md:mb-0">현재 레벨</h3>
          
          <div className="flex items-center">
            <div className="text-lg font-bold mr-2">
              {userLevel}
            </div>
            <span className="text-gray-600">Lv.</span>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-gray-600">경험치</span>
            <span className="text-sm font-medium">
              {currentLevelExp.toLocaleString()} / {nextLevelTotalExp.toLocaleString()} XP
            </span>
          </div>
          
          {/* 경험치 진행 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <p className="mt-2 text-sm text-gray-600">
            다음 레벨까지 {remainingExp.toLocaleString()} XP 필요
          </p>
        </div>
      </div>
      
      {/* 경험치 획득 안내 */}
      <div className="p-0 mt-6">
        <h3 className="font-medium text-gray-900 mb-2">경험치 획득 방법</h3>
        <p className="text-gray-600 text-sm mb-4">
          다양한 활동을 통해 경험치를 획득하고 레벨을 올릴 수 있습니다.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>게시글 작성 - {ACTIVITY_REWARDS.POST_CREATION.exp} XP (하루 {ACTIVITY_REWARDS.POST_CREATION.exp * 5}XP 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>댓글 작성 - {ACTIVITY_REWARDS.COMMENT_CREATION.exp} XP (하루 {ACTIVITY_REWARDS.COMMENT_CREATION.exp * 5}XP 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>추천 받기 - {ACTIVITY_REWARDS.RECEIVED_LIKE.exp} XP (하루 {ACTIVITY_REWARDS.RECEIVED_LIKE.exp * 10}XP 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>하루 최초 로그인 - {ACTIVITY_REWARDS.DAILY_LOGIN.exp} XP</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>연속 출석 보너스 - {ACTIVITY_REWARDS.CONSECUTIVE_LOGIN.exp} XP</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
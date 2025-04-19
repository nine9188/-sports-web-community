'use client';

import React from 'react';
import { ACTIVITY_REWARDS, ActivityType } from '@/app/utils/activity-rewards';

interface PointsFormProps {
  userId: string;
  userPoints: number;
  userLevel: number;
}

export default function PointsForm({ 
  userPoints = 0, 
}: PointsFormProps) {
  return (
    <div className="space-y-6">
      {/* 현재 포인트 정보 */}
      <div className="bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-2 md:mb-0">보유 포인트</h3>
          
          <div className="flex items-center">
            <span className="text-lg font-bold mr-2">{userPoints.toLocaleString()}</span>
            <span className="text-gray-600">P</span>
          </div>
        </div>
        
        <div className="border-t">
        </div>
      </div>
      
      {/* 포인트 획득 안내 */}
      <div className="p-0 mt-6">
        <h3 className="font-medium text-gray-900 mb-2">포인트 획득 방법</h3>
        <p className="text-gray-600 text-sm mb-4">
          다양한 활동을 통해 포인트를 획득하고 아이템을 구매할 수 있습니다.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>게시글 작성 - {ACTIVITY_REWARDS[ActivityType.POST_CREATION].points} P (하루 {ACTIVITY_REWARDS[ActivityType.POST_CREATION].points * 5}P 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>댓글 작성 - {ACTIVITY_REWARDS[ActivityType.COMMENT_CREATION].points} P (하루 {ACTIVITY_REWARDS[ActivityType.COMMENT_CREATION].points * 5}P 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>추천 받기 - {ACTIVITY_REWARDS[ActivityType.RECEIVED_LIKE].points} P (하루 {ACTIVITY_REWARDS[ActivityType.RECEIVED_LIKE].points * 10}P 제한)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>하루 최초 로그인 - {ACTIVITY_REWARDS[ActivityType.DAILY_LOGIN].points} P</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-blue-600">•</span>
              <span>연속 출석 보너스 - {ACTIVITY_REWARDS[ActivityType.CONSECUTIVE_LOGIN].points} P</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
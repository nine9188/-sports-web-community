'use client';

import { useMemo } from 'react';
import { GoalValue, TeamStatsData } from '@/domains/livescore/types/stats';
import { findMaxGoalValue, calculateGoalPercentage } from '../utils/chartUtils';

interface GoalsChartProps {
  stats: TeamStatsData;
}

export default function GoalsChart({ stats }: GoalsChartProps) {
  // 득점 시간대
  const scoredGoalsByMinute = useMemo(() => {
    return stats.goals?.for?.minute || {};
  }, [stats.goals]);

  // 실점 시간대
  const concededGoalsByMinute = useMemo(() => {
    return stats.goals?.against?.minute || {};
  }, [stats.goals]);

  // 최대 골 수 계산
  const maxGoals = useMemo(() => {
    const maxScored = findMaxGoalValue(scoredGoalsByMinute);
    const maxConceded = findMaxGoalValue(concededGoalsByMinute);
    return Math.max(maxScored, maxConceded);
  }, [scoredGoalsByMinute, concededGoalsByMinute]);

  // 시간대 레이블 정의
  const timeRanges = [
    '0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'
  ];

  // 차트 바 렌더링 함수
  const renderBar = (value: GoalValue | undefined, maxValue: number, type: 'scored' | 'conceded') => {
    if (!value) return null;
    
    const total = value.total || 0;
    const percentage = calculateGoalPercentage(total, maxValue);
    
    return (
      <div className="flex items-center">
        <div 
          className={`h-5 ${type === 'scored' ? 'bg-green-200' : 'bg-red-200'} rounded`}
          style={{ width: `${percentage}%` }}
        />
        <span className={`ml-2 text-xs ${type === 'scored' ? 'text-green-600' : 'text-red-600'}`}>
          {total} ({value.percentage || '0%'})
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden mb-4">
      <h3 className="text-sm font-medium p-3 border-b border-gray-200">시간대별 득실점</h3>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-8">
          {/* 득점 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-green-700">득점</h4>
            <div className="space-y-4">
              {timeRanges.map((range) => (
                <div key={`scored-${range}`} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{range}분</span>
                  </div>
                  {renderBar(scoredGoalsByMinute[range], maxGoals, 'scored')}
                </div>
              ))}
            </div>
          </div>

          {/* 실점 차트 */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-red-700">실점</h4>
            <div className="space-y-4">
              {timeRanges.map((range) => (
                <div key={`conceded-${range}`} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{range}분</span>
                  </div>
                  {renderBar(concededGoalsByMinute[range], maxGoals, 'conceded')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
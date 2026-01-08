'use client';

import { useMemo } from 'react';
import { GoalValue, TeamStatsData } from '@/domains/livescore/types/stats';
import { findMaxGoalValue, calculateGoalPercentage } from '../utils/chartUtils';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

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

  // 바 퍼센트 계산
  const getBarPercentage = (value: GoalValue | undefined) => {
    if (!value) return 0;
    const total = value.total || 0;
    return calculateGoalPercentage(total, maxGoals);
  };

  const getGoalValue = (value: GoalValue | undefined) => {
    return value?.total || 0;
  };

  return (
    <Container className="mb-4">
      <ContainerHeader>
        <ContainerTitle>시간대별 득실점</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="!p-0">
        {/* 소제목 */}
        <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 py-2 px-4 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400">
            득점
          </div>
          <div className="w-16 py-2 px-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
            시간대
          </div>
          <div className="flex-1 py-2 px-4 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400">
            실점
          </div>
        </div>
        {/* 데이터 행들 */}
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {timeRanges.map((range) => {
            const scoredValue = scoredGoalsByMinute[range];
            const concededValue = concededGoalsByMinute[range];
            const scoredPercent = getBarPercentage(scoredValue);
            const concededPercent = getBarPercentage(concededValue);
            const scoredGoals = getGoalValue(scoredValue);
            const concededGoals = getGoalValue(concededValue);

            return (
              <div key={range} className="flex items-center h-10">
                {/* 득점 바 (오른쪽에서 왼쪽으로) */}
                <div className="flex-1 flex items-center justify-end px-2 gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{scoredGoals}</span>
                  <div className="flex-1 flex justify-end">
                    <div
                      className="h-5 bg-green-100 dark:bg-green-800/50 rounded-l"
                      style={{ width: `${scoredPercent}%` }}
                    />
                  </div>
                </div>

                {/* 시간대 (중앙) */}
                <div className="w-16 text-center text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0 border-x border-black/5 dark:border-white/10">
                  {range}분
                </div>

                {/* 실점 바 (왼쪽에서 오른쪽으로) */}
                <div className="flex-1 flex items-center px-2 gap-2">
                  <div className="flex-1 flex justify-start">
                    <div
                      className="h-5 bg-red-100 dark:bg-red-800/50 rounded-r"
                      style={{ width: `${concededPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{concededGoals}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ContainerContent>
    </Container>
  );
}

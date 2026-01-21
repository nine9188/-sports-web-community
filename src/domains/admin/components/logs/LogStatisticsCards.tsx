'use client';

import { cn } from '@/shared/utils/cn';
import { badgeBaseStyles } from '@/shared/styles';
import { LEVEL_COLORS, CATEGORY_COLORS } from './constants';
import type { LogStatistics, LogLevel, LogCategory } from './types';

interface LogStatisticsCardsProps {
  statistics: LogStatistics;
}

export function LogStatisticsCards({ statistics }: LogStatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <div className="p-4">
          <div className="text-2xl font-bold">{statistics.totalLogs.toLocaleString()}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">오늘 총 로그</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <div className="p-4">
          <div className="text-2xl font-bold text-red-600">{statistics.errorCount.toLocaleString()}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">오늘 에러</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <div className="p-4">
          <div className="text-sm space-y-1">
            {Object.entries(statistics.levelStats).map(([level, count]) => (
              <div key={level} className="flex justify-between">
                <span className={cn(badgeBaseStyles, LEVEL_COLORS[level as LogLevel])}>{level}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10">
        <div className="p-4">
          <div className="text-sm space-y-1">
            {Object.entries(statistics.categoryStats)
              .slice(0, 4)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span className={cn(badgeBaseStyles, CATEGORY_COLORS[category as LogCategory])}>{category}</span>
                  <span>{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

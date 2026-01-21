'use client';

import {
  LEVEL_EXP_REQUIREMENTS,
  calculateLevelFromExp,
  calculateLevelProgress,
} from '@/shared/utils/level-icons';
import type { UserInfo } from './types';

interface ExpInfoCardProps {
  user: UserInfo;
  previewExpAmount?: number;
}

export function ExpInfoCard({ user, previewExpAmount }: ExpInfoCardProps) {
  const safeLevel = user.level || 1;
  const currentLevelExp = LEVEL_EXP_REQUIREMENTS[safeLevel - 1] || 0;
  const nextLevelExp = LEVEL_EXP_REQUIREMENTS[safeLevel] || '최대';

  const expPercentage = calculateLevelProgress(safeLevel, user.exp || 0);

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-md mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">레벨:</div>
        <div className="font-semibold text-gray-700 dark:text-gray-300">Lv. {safeLevel}</div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">현재 경험치:</div>
        <div className="font-semibold text-gray-700 dark:text-gray-300">{user.exp || 0} EXP</div>
      </div>

      {/* 경험치 조정 미리보기 */}
      {previewExpAmount !== undefined && !isNaN(previewExpAmount) && previewExpAmount !== 0 && (
        <div className="mt-3 pt-3 border-t border-black/7 dark:border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">조정 후:</span>
            <span
              className={`font-medium ${previewExpAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {Math.max(0, (user.exp || 0) + previewExpAmount)} EXP{' '}
              <span className="text-gray-500 dark:text-gray-400">
                (Lv. {calculateLevelFromExp(Math.max(0, (user.exp || 0) + previewExpAmount))})
              </span>
            </span>
          </div>
        </div>
      )}

      {/* 경험치 진행바 */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${expPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>
            레벨 {safeLevel} ({currentLevelExp} EXP)
          </span>
          <span>
            레벨 {safeLevel + 1} ({nextLevelExp} EXP)
          </span>
        </div>
      </div>
    </div>
  );
}

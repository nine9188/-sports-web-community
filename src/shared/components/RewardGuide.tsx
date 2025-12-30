'use client';

import { REWARD_DISPLAY_LIST, CONSECUTIVE_LOGIN_BONUSES } from '@/shared/constants/rewards';

interface RewardGuideProps {
  /** 표시할 보상 타입: 'exp' = 경험치, 'points' = 포인트 */
  type: 'exp' | 'points';
}

/**
 * 보상 획득 방법 안내 컴포넌트
 * 경험치 페이지와 포인트 페이지에서 공용으로 사용합니다.
 */
export default function RewardGuide({ type }: RewardGuideProps) {
  const isExp = type === 'exp';
  const title = isExp ? '경험치 획득 방법' : '포인트 획득 방법';
  const description = isExp
    ? '다양한 활동을 통해 경험치를 획득하고 레벨을 올릴 수 있습니다.'
    : '다양한 활동을 통해 포인트를 획득하고 아이템을 구매할 수 있습니다.';
  const unit = isExp ? 'XP' : 'P';

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">
        {title}
      </h3>
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
        {description}
      </p>
      <div className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg p-4">
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {REWARD_DISPLAY_LIST.map((item) => {
            const value = isExp ? item.exp : item.points;
            const dailyMax = isExp ? item.dailyMaxExp : item.dailyMaxPoints;

            // 연속 출석 보너스는 별도로 마일스톤 표시
            if (item.type === 'consecutive_login') {
              return null;
            }

            return (
              <li key={item.type} className="flex items-start">
                <span className="mr-2 text-gray-900 dark:text-[#F0F0F0]">•</span>
                <span>
                  {item.description} - {value} {unit}
                  {item.dailyLimit && dailyMax && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}(하루 {dailyMax}{unit} 제한)
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {/* 연속 출석 마일스톤 */}
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
          <p className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-2">연속 출석 보너스</p>
          <div className="grid grid-cols-2 gap-2">
            {CONSECUTIVE_LOGIN_BONUSES.map((bonus) => (
              <div key={bonus.days} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{bonus.label}</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">
                  {isExp ? `+${bonus.exp} ${unit}` : `+${bonus.points} ${unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

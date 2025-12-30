'use client';

/**
 * 활동 보상 클라이언트 래퍼
 * 서버 액션과 공용 상수를 클라이언트에서 사용하기 위한 모듈
 */

// 서버 액션 import
import {
  rewardUserActivity,
  checkConsecutiveLogin,
  getActivityTypeValues
} from '@/shared/actions/activity-actions';

// 공용 상수 re-export (클라이언트에서 직접 사용 가능)
export {
  ActivityTypes,
  ACTIVITY_REWARDS,
  DAILY_LIMITS,
  REWARD_DISPLAY_LIST,
  DAILY_MAX_EXP,
  DAILY_MAX_POINTS,
  type ActivityType,
  type ActivityReward,
  type RewardDisplayItem
} from '@/shared/constants/rewards';

// 서버 액션 re-export
export {
  rewardUserActivity,
  checkConsecutiveLogin,
  getActivityTypeValues
};

// 하위 호환성을 위한 alias
export { ActivityTypes as ActivityTypeValues } from '@/shared/constants/rewards'; 
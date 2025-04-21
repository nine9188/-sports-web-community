'use client';

// 서버 액션을 클라이언트에서 사용하기 위한 간소화된 래퍼
import { 
  rewardUserActivity, 
  checkConsecutiveLogin,
  getActivityTypeValues,
  type ActivityType as ActivityTypeEnum
} from '@/app/actions/activity-actions';

// 클라이언트에서 상수로 사용하기 위한 활동 유형 정의
export const ActivityTypeValues = {
  POST_CREATION: 'post_creation',
  COMMENT_CREATION: 'comment_creation', 
  RECEIVED_LIKE: 'received_like',
  DAILY_LOGIN: 'daily_login',
  CONSECUTIVE_LOGIN: 'consecutive_login'
} as const;

export {
  rewardUserActivity,
  checkConsecutiveLogin,
  getActivityTypeValues
};

export type { ActivityTypeEnum as ActivityType }; 
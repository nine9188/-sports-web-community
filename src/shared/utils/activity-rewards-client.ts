'use client';

// 서버 액션을 클라이언트에서 사용하기 위한 간소화된 래퍼
import { 
  rewardUserActivity, 
  checkConsecutiveLogin,
  getActivityTypeValues,
  getActivityTypesForClient,
  type ActivityType as ActivityTypeEnum
} from '@/shared/actions/activity-actions';

// 클라이언트에서 상수로 사용하기 위한 활동 유형 정의
// 초기 빈 객체 생성
export const ActivityTypeValues = {
  POST_CREATION: 'post_creation',
  COMMENT_CREATION: 'comment_creation', 
  RECEIVED_LIKE: 'received_like',
  DAILY_LOGIN: 'daily_login',
  CONSECUTIVE_LOGIN: 'consecutive_login'
} as const;

// 서버에서 값을 불러오는 함수
// 이 코드는 클라이언트 컴포넌트 내에서 효과(Effect) 안에서 호출해야 함
export async function initActivityTypes() {
  const serverTypes = await getActivityTypesForClient();
  // 값 업데이트를 위한 코드 (필요시 구현)
  return serverTypes;
}

export {
  rewardUserActivity,
  checkConsecutiveLogin,
  getActivityTypeValues
};

export type { ActivityTypeEnum as ActivityType }; 
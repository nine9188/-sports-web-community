// 활동 유형 정의
export enum ActivityType {
  POST_CREATION = 'post_creation',
  COMMENT_CREATION = 'comment_creation', 
  RECEIVED_LIKE = 'received_like',
  DAILY_LOGIN = 'daily_login',
  CONSECUTIVE_LOGIN = 'consecutive_login'
}

// 각 활동별 보상 정의
export const ACTIVITY_REWARDS = {
  [ActivityType.POST_CREATION]: { exp: 25, points: 5, reason: '게시글 작성' },
  [ActivityType.COMMENT_CREATION]: { exp: 5, points: 1, reason: '댓글 작성' },
  [ActivityType.RECEIVED_LIKE]: { exp: 5, points: 1, reason: '추천' },
  [ActivityType.DAILY_LOGIN]: { exp: 30, points: 5, reason: '하루 최초 로그인' },
  [ActivityType.CONSECUTIVE_LOGIN]: { exp: 30, points: 5, reason: '연속 출석 보너스' }
};

// 각 활동별 일일 제한
export const DAILY_LIMITS = {
  [ActivityType.POST_CREATION]: { count: 5, points: 25 },
  [ActivityType.COMMENT_CREATION]: { count: 5, points: 5 },
  [ActivityType.RECEIVED_LIKE]: { count: 10, points: 10 },
  [ActivityType.DAILY_LOGIN]: { count: 1, points: 5 },
  [ActivityType.CONSECUTIVE_LOGIN]: { count: 1, points: 5 }
}; 
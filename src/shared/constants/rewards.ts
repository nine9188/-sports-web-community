/**
 * 활동 보상 시스템 공용 상수
 *
 * 이 파일은 서버와 클라이언트 모두에서 사용됩니다.
 * 보상 값을 수정할 때는 이 파일만 수정하면 됩니다.
 */

// 활동 유형 정의
export const ActivityTypes = {
  POST_CREATION: 'post_creation',
  COMMENT_CREATION: 'comment_creation',
  RECEIVED_LIKE: 'received_like',
  GIVE_LIKE: 'give_like',                    // Phase 3: 추천하기
  DAILY_LOGIN: 'daily_login',
  CONSECUTIVE_LOGIN: 'consecutive_login',
  FIRST_POST_BONUS: 'first_post_bonus',      // Phase 3: 첫 게시글 보너스
  FIRST_COMMENT_BONUS: 'first_comment_bonus', // Phase 3: 첫 댓글 보너스
} as const;

export type ActivityType = typeof ActivityTypes[keyof typeof ActivityTypes];

// 활동별 보상 정의
export interface ActivityReward {
  exp: number;
  points: number;
  reason: string;
  dailyLimit: number;
}

export const ACTIVITY_REWARDS: Record<ActivityType, ActivityReward> = {
  [ActivityTypes.POST_CREATION]: {
    exp: 100,     // Phase 4: 50 → 100
    points: 50,   // Phase 4: 10 → 50
    reason: '게시글 작성',
    dailyLimit: 10,
  },
  [ActivityTypes.COMMENT_CREATION]: {
    exp: 10,      // Phase 4: 15 → 10
    points: 5,    // Phase 4: 3 → 5
    reason: '댓글 작성',
    dailyLimit: 10,
  },
  [ActivityTypes.RECEIVED_LIKE]: {
    exp: 10,
    points: 5,    // Phase 4: 2 → 5
    reason: '추천 받기',
    dailyLimit: 20,
  },
  [ActivityTypes.GIVE_LIKE]: {
    exp: 3,
    points: 0,
    reason: '추천하기',
    dailyLimit: 20,
  },
  [ActivityTypes.DAILY_LOGIN]: {
    exp: 100,     // Phase 4: 50 → 100
    points: 50,   // Phase 4: 10 → 50
    reason: '하루 최초 로그인',
    dailyLimit: 1,
  },
  [ActivityTypes.CONSECUTIVE_LOGIN]: {
    exp: 30,
    points: 5,
    reason: '연속 출석 보너스',
    dailyLimit: 1,
  },
  [ActivityTypes.FIRST_POST_BONUS]: {
    exp: 60,      // Phase 4: 20 → 60
    points: 30,   // Phase 4: 5 → 30
    reason: '오늘의 첫 게시글 보너스',
    dailyLimit: 1,
  },
  [ActivityTypes.FIRST_COMMENT_BONUS]: {
    exp: 20,      // Phase 4: 10 → 20
    points: 10,   // Phase 4: 2 → 10
    reason: '오늘의 첫 댓글 보너스',
    dailyLimit: 1,
  },
};

// 일일 제한 정보 (포인트 기준)
export const DAILY_LIMITS: Record<ActivityType, { count: number; maxPoints: number; maxExp: number }> = {
  [ActivityTypes.POST_CREATION]: {
    count: 10,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.POST_CREATION].points * 10,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.POST_CREATION].exp * 10,
  },
  [ActivityTypes.COMMENT_CREATION]: {
    count: 10,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.COMMENT_CREATION].points * 10,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.COMMENT_CREATION].exp * 10,
  },
  [ActivityTypes.RECEIVED_LIKE]: {
    count: 20,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.RECEIVED_LIKE].points * 20,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.RECEIVED_LIKE].exp * 20,
  },
  [ActivityTypes.GIVE_LIKE]: {
    count: 20,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.GIVE_LIKE].points * 20,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.GIVE_LIKE].exp * 20,
  },
  [ActivityTypes.DAILY_LOGIN]: {
    count: 1,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].points,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].exp,
  },
  [ActivityTypes.CONSECUTIVE_LOGIN]: {
    count: 1,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.CONSECUTIVE_LOGIN].points,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.CONSECUTIVE_LOGIN].exp,
  },
  [ActivityTypes.FIRST_POST_BONUS]: {
    count: 1,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.FIRST_POST_BONUS].points,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.FIRST_POST_BONUS].exp,
  },
  [ActivityTypes.FIRST_COMMENT_BONUS]: {
    count: 1,
    maxPoints: ACTIVITY_REWARDS[ActivityTypes.FIRST_COMMENT_BONUS].points,
    maxExp: ACTIVITY_REWARDS[ActivityTypes.FIRST_COMMENT_BONUS].exp,
  },
};

// 보상 목록 (UI 표시용)
export interface RewardDisplayItem {
  type: ActivityType;
  description: string;
  exp: number;
  points: number;
  dailyLimit?: number;
  dailyMaxExp?: number;
  dailyMaxPoints?: number;
}

export const REWARD_DISPLAY_LIST: RewardDisplayItem[] = [
  {
    type: ActivityTypes.POST_CREATION,
    description: '게시글 작성',
    exp: ACTIVITY_REWARDS[ActivityTypes.POST_CREATION].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.POST_CREATION].points,
    dailyLimit: 10,
    dailyMaxExp: DAILY_LIMITS[ActivityTypes.POST_CREATION].maxExp,
    dailyMaxPoints: DAILY_LIMITS[ActivityTypes.POST_CREATION].maxPoints,
  },
  {
    type: ActivityTypes.COMMENT_CREATION,
    description: '댓글 작성',
    exp: ACTIVITY_REWARDS[ActivityTypes.COMMENT_CREATION].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.COMMENT_CREATION].points,
    dailyLimit: 10,
    dailyMaxExp: DAILY_LIMITS[ActivityTypes.COMMENT_CREATION].maxExp,
    dailyMaxPoints: DAILY_LIMITS[ActivityTypes.COMMENT_CREATION].maxPoints,
  },
  {
    type: ActivityTypes.RECEIVED_LIKE,
    description: '추천 받기',
    exp: ACTIVITY_REWARDS[ActivityTypes.RECEIVED_LIKE].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.RECEIVED_LIKE].points,
    dailyLimit: 20,
    dailyMaxExp: DAILY_LIMITS[ActivityTypes.RECEIVED_LIKE].maxExp,
    dailyMaxPoints: DAILY_LIMITS[ActivityTypes.RECEIVED_LIKE].maxPoints,
  },
  {
    type: ActivityTypes.GIVE_LIKE,
    description: '추천하기',
    exp: ACTIVITY_REWARDS[ActivityTypes.GIVE_LIKE].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.GIVE_LIKE].points,
    dailyLimit: 20,
    dailyMaxExp: DAILY_LIMITS[ActivityTypes.GIVE_LIKE].maxExp,
    dailyMaxPoints: DAILY_LIMITS[ActivityTypes.GIVE_LIKE].maxPoints,
  },
  {
    type: ActivityTypes.DAILY_LOGIN,
    description: '하루 최초 로그인',
    exp: ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].points,
  },
  {
    type: ActivityTypes.FIRST_POST_BONUS,
    description: '오늘의 첫 게시글',
    exp: ACTIVITY_REWARDS[ActivityTypes.FIRST_POST_BONUS].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.FIRST_POST_BONUS].points,
  },
  {
    type: ActivityTypes.FIRST_COMMENT_BONUS,
    description: '오늘의 첫 댓글',
    exp: ACTIVITY_REWARDS[ActivityTypes.FIRST_COMMENT_BONUS].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.FIRST_COMMENT_BONUS].points,
  },
  {
    type: ActivityTypes.CONSECUTIVE_LOGIN,
    description: '연속 출석 보너스 (7일/14일/21일/30일)',
    exp: ACTIVITY_REWARDS[ActivityTypes.CONSECUTIVE_LOGIN].exp,
    points: ACTIVITY_REWARDS[ActivityTypes.CONSECUTIVE_LOGIN].points,
  },
];

// 일일 최대 획득량 계산
export const DAILY_MAX_EXP = Object.values(DAILY_LIMITS).reduce((sum, limit) => sum + limit.maxExp, 0);
export const DAILY_MAX_POINTS = Object.values(DAILY_LIMITS).reduce((sum, limit) => sum + limit.maxPoints, 0);

// 연속 출석 보너스 정의
export interface ConsecutiveLoginBonus {
  days: number;
  exp: number;
  points: number;
  label: string;
}

export const CONSECUTIVE_LOGIN_BONUSES: ConsecutiveLoginBonus[] = [
  { days: 7, exp: 200, points: 200, label: '1주 연속 출석' },
  { days: 14, exp: 400, points: 500, label: '2주 연속 출석' },
  { days: 21, exp: 600, points: 800, label: '3주 연속 출석' },
  { days: 30, exp: 1000, points: 1500, label: '월간 출석 완료' },
];

/**
 * 연속 출석 일수에 따른 보너스 반환
 */
export function getConsecutiveBonus(consecutiveDays: number): ConsecutiveLoginBonus | null {
  return CONSECUTIVE_LOGIN_BONUSES.find(bonus => bonus.days === consecutiveDays) || null;
}

// ============================================
// 추천 시스템 보상 정의
// ============================================

// 추천인/피추천인 가입 시 기본 보상
export const REFERRAL_REWARDS = {
  // 추천인 보상 (가입 시)
  REFERRER_SIGNUP: {
    points: 500,
    exp: 100,
    reason: '친구 추천 보상',
  },
  // 피추천인 보상 (가입 시)
  REFEREE_SIGNUP: {
    points: 300,
    exp: 50,
    reason: '추천 코드 사용 보상',
  },
} as const;

// 마일스톤 보상 정의 (피추천인 활동 시 추천인에게 지급)
export interface ReferralMilestone {
  type: 'first_post' | 'first_comment' | 'seven_day_streak';
  points: number;
  exp: number;
  label: string;
  description: string;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  {
    type: 'first_post',
    points: 200,
    exp: 50,
    label: '첫 게시글 작성',
    description: '추천한 친구가 첫 게시글을 작성했습니다',
  },
  {
    type: 'first_comment',
    points: 100,
    exp: 30,
    label: '첫 댓글 작성',
    description: '추천한 친구가 첫 댓글을 작성했습니다',
  },
  {
    type: 'seven_day_streak',
    points: 500,
    exp: 100,
    label: '7일 연속 출석',
    description: '추천한 친구가 7일 연속 출석했습니다',
  },
];

/**
 * 마일스톤 타입에 따른 보상 반환
 */
export function getReferralMilestone(type: ReferralMilestone['type']): ReferralMilestone | null {
  return REFERRAL_MILESTONES.find(m => m.type === type) || null;
}

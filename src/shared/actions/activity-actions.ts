'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { calculateLevelFromExp } from '@/shared/utils/level-icons';

// 활동 유형 정의 - 내부에서만 사용하는 상수 (export 하지 않음)
const ActivityTypeValues = {
  POST_CREATION: 'post_creation',
  COMMENT_CREATION: 'comment_creation', 
  RECEIVED_LIKE: 'received_like',
  DAILY_LOGIN: 'daily_login',
  CONSECUTIVE_LOGIN: 'consecutive_login'
} as const;

// 타입 정의는 별도로 유지
export type ActivityType = typeof ActivityTypeValues[keyof typeof ActivityTypeValues];

// 클라이언트에서 사용할 ActivityTypeValues를 async 함수로 내보냄
export async function getActivityTypeValues() {
  return ActivityTypeValues;
}

// 활동 상수를 async 함수로 내보냄 (기존 코드와의 호환성 유지)
export async function getActivityTypes() {
  return ActivityTypeValues;
}

// 클라이언트에서 사용할 ActivityTypes를 가져오는 비동기 함수
export async function getActivityTypesForClient() {
  return ActivityTypeValues;
}

// 각 활동별 보상 정의
export async function getActivityRewards() {
  return {
    [ActivityTypeValues.POST_CREATION]: { exp: 25, points: 5, reason: '게시글 작성' },
    [ActivityTypeValues.COMMENT_CREATION]: { exp: 5, points: 1, reason: '댓글 작성' },
    [ActivityTypeValues.RECEIVED_LIKE]: { exp: 5, points: 1, reason: '추천' },
    [ActivityTypeValues.DAILY_LOGIN]: { exp: 30, points: 5, reason: '하루 최초 로그인' },
    [ActivityTypeValues.CONSECUTIVE_LOGIN]: { exp: 30, points: 5, reason: '연속 출석 보너스' }
  };
}

// 각 활동별 일일 제한
export async function getDailyLimits() {
  return {
    [ActivityTypeValues.POST_CREATION]: { count: 5, points: 25 },
    [ActivityTypeValues.COMMENT_CREATION]: { count: 5, points: 5 },
    [ActivityTypeValues.RECEIVED_LIKE]: { count: 10, points: 10 },
    [ActivityTypeValues.DAILY_LOGIN]: { count: 1, points: 5 },
    [ActivityTypeValues.CONSECUTIVE_LOGIN]: { count: 1, points: 5 }
  };
}

// 활동 이력 캐시 (메모리 내 간단한 캐시)
const activityCache = new Map<string, number>();

// 캐시 키 생성 함수 (서버 액션 내에서만 사용되므로 export 하지 않음)
async function createCacheKey(userId: string, activityType: ActivityType): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
  return `${userId}_${activityType}_${today}`;
}

// 활동 보상 함수 (서버 액션으로 사용)
export async function rewardUserActivity(
  userId: string, 
  activityType: ActivityType,
  relatedId?: string // 게시글 ID, 댓글 ID 등 관련 데이터 ID
): Promise<{ success: boolean, error?: string }> {
  try {
    // 캐시 확인 (중복 호출 방지)
    const cacheKey = await createCacheKey(userId, activityType);
    const ACTIVITY_REWARDS = await getActivityRewards(); 
    const DAILY_LIMITS = await getDailyLimits();
    
    const cachedCount = activityCache.get(cacheKey) || 0;
    
    if (cachedCount >= DAILY_LIMITS[activityType].count) {
      // 이미 캐시에서 제한에 도달한 것으로 확인됨
      if (process.env.NODE_ENV === 'development') {
        console.debug(`캐시: 사용자(${userId})가 ${activityType} 활동 제한에 도달했습니다.`);
      }
      return { success: false, error: '오늘 이 활동으로 받을 수 있는 보상을 모두 받았습니다.' };
    }
    
    const supabase = await createClient();
    
    // 관련 ID 로깅 (미사용 변수 경고 방지)
    if (relatedId && process.env.NODE_ENV === 'development') {
      console.debug(`활동 관련 ID: ${relatedId}`);
    }
    
    // 오늘 날짜 계산 (KST 기준, 자정부터 자정까지)
    const now = new Date();
    
    // 오늘 날짜의 시작 시간 (00:00:00.000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 오늘 날짜의 끝 시간 (23:59:59.999)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // 1. 오늘 해당 활동으로 보상 받은 횟수 확인 (시간 범위 정확히 지정)
    const { count: activityCount, error: countError } = await supabase
      .from('exp_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', ACTIVITY_REWARDS[activityType].reason)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());
      
    if (countError) {
      console.error('활동 내역 조회 오류:', countError);
      return { success: false, error: '활동 내역 조회 중 오류가 발생했습니다.' };
    }
    
    // 카운트 캐시 업데이트
    activityCache.set(cacheKey, activityCount || 0);
    
    // 2. 일일 제한 확인
    if (activityCount && DAILY_LIMITS[activityType].count > 0 && 
        activityCount >= DAILY_LIMITS[activityType].count) {
      // 일일 제한에 도달한 경우 (로그만 남기고 에러는 리턴하지 않음)
      if (process.env.NODE_ENV === 'development') {
        console.log(`사용자(${userId})가 ${activityType} 활동 제한에 도달했습니다.`);
      }
      return { success: false, error: '오늘 이 활동으로 받을 수 있는 보상을 모두 받았습니다.' };
    }
    
    // 3. 현재 사용자 경험치와 포인트 가져오기
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('exp, points')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('사용자 데이터 조회 오류:', userError);
      return { success: false, error: '사용자 정보를 조회할 수 없습니다.' };
    }
    
    const currentExp = userData.exp || 0;
    const currentPoints = userData.points || 0;
    
    // 4. 경험치와 포인트 계산
    const expReward = ACTIVITY_REWARDS[activityType].exp;
    const pointsReward = ACTIVITY_REWARDS[activityType].points;
    
    // 5-7. 트랜잭션으로 모든 작업을 한 번에 처리 (성능 향상)
    try {
      // 5. 보상 내역 기록 - 경험치 히스토리
      const { error: expHistoryError } = await supabase
        .from('exp_history')
        .insert({
          user_id: userId,
          exp: expReward,
          reason: ACTIVITY_REWARDS[activityType].reason
        });
        
      if (expHistoryError) {
        console.error('경험치 기록 저장 오류 상세:', expHistoryError.message, expHistoryError.details, expHistoryError.hint);
        return { success: false, error: `경험치 기록을 저장할 수 없습니다: ${expHistoryError.message}` };
      }
      
      // 6. 보상 내역 기록 - 포인트 히스토리
      const { error: pointHistoryError } = await supabase
        .from('point_history')
        .insert({
          user_id: userId,
          points: pointsReward,
          reason: ACTIVITY_REWARDS[activityType].reason
        });
        
      if (pointHistoryError) {
        console.error('포인트 기록 저장 오류:', pointHistoryError);
        return { success: false, error: '포인트 기록을 저장할 수 없습니다.' };
      }
      
      // 7. 사용자 경험치와 포인트 업데이트
      const newExp = currentExp + expReward;
      const newPoints = currentPoints + pointsReward;
      const newLevel = calculateLevelFromExp(newExp);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          exp: newExp,
          points: newPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('사용자 프로필 업데이트 오류:', updateError);
        return { success: false, error: '사용자 프로필을 업데이트할 수 없습니다.' };
      }
    } catch (error) {
      console.error('활동 보상 처리 중 예외 발생:', error);
      return { success: false, error: '보상 처리 중 오류가 발생했습니다.' };
    }
    
    // 캐시 업데이트 (활동 횟수 증가)
    activityCache.set(cacheKey, (activityCache.get(cacheKey) || 0) + 1);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`사용자(${userId})에게 ${activityType} 활동 보상 지급: EXP +${expReward}, Points +${pointsReward}`);
    }
    return { success: true };
  } catch (error) {
    console.error('활동 보상 처리 중 예외 발생:', error);
    return { success: false, error: '보상 처리 중 오류가 발생했습니다.' };
  }
}

// 연속 로그인 확인 함수
export async function checkConsecutiveLogin(userId: string): Promise<{ consecutive: number, reward: boolean }> {
  try {
    const supabase = await createClient();
    
    // 1. 사용자의 마지막 로그인 기록 가져오기
    const { data: lastLogins, error: historyError } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('user_id', userId)
      .order('login_date', { ascending: false })
      .limit(30); // 최근 30일까지만 확인
    
    if (historyError || !lastLogins || lastLogins.length === 0) {
      return { consecutive: 1, reward: false }; // 기록이 없으면 첫 로그인으로 간주
    }
    
    // 2. 일자별로 로그인 여부를 검사 (중복 제거)
    const loginDaysSet = new Set(
      lastLogins.map(record => 
        new Date(record.login_date).toISOString().split('T')[0]
      )
    );
    
    const loginDays = Array.from(loginDaysSet).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    // 3. 오늘 날짜 확인
    const today = new Date().toISOString().split('T')[0];
    
    // 4. 어제 날짜 확인
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 5. 이미 오늘 로그인했는지 확인 (첫 번째 요소가 오늘인지)
    const alreadyLoggedInToday = loginDays[0] === today;
    
    // 6. 어제 로그인했는지 확인
    const loggedInYesterday = loginDays.includes(yesterdayStr);

    // 7. 연속 로그인 일수 계산
    let consecutiveDays = 1; // 오늘 포함
    
    // 6-7일 연속 로그인 보상은 한 번만 지급 (최초 달성 시)
    // 이전에 6-7일 연속 로그인 보상을 받은 적이 있는지 확인
    const supabase2 = await createClient();
    const { count: rewardRecords } = await supabase2
      .from('exp_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', '연속 출석 보너스');
      
    // 8. 새 로그인 기록 저장 (오늘 처음 로그인한 경우에만)
    if (!alreadyLoggedInToday) {
      await supabase
        .from('login_history')
        .insert({
          user_id: userId,
          login_date: today
        });
    }
    
    // 9. 어제 로그인하지 않았다면 연속 로그인 초기화
    if (!loggedInYesterday) {
      return { consecutive: 1, reward: false };
    }
    
    // 10. 마지막 로그인부터 역순으로 연속 일수 계산
    for (let i = 1; i < loginDays.length; i++) {
      const currentDate = new Date(loginDays[i]);
      const previousDate = new Date(loginDays[i-1]);
      
      // 날짜 차이가 1일이면 연속 로그인
      const diffTime = previousDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    // 11. 7일 이상 연속 로그인이면 보상 조건 충족
    const rewardEligible = consecutiveDays >= 7 && rewardRecords === 0;
    
    return { 
      consecutive: consecutiveDays,
      reward: rewardEligible
    };
  } catch (error) {
    console.error('연속 로그인 확인 오류:', error);
    return { consecutive: 1, reward: false };
  }
}

 
import { createClient } from '@/app/lib/supabase-browser';
import { calculateLevelFromExp } from '@/app/utils/level-icons';

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

// 활동 보상 함수
export async function rewardUserActivity(
  userId: string, 
  activityType: ActivityType,
  relatedId?: string // 게시글 ID, 댓글 ID 등 관련 데이터 ID
): Promise<{ success: boolean, error?: string }> {
  try {
    const supabase = createClient();
    
    // 관련 ID 로깅 (미사용 변수 경고 방지)
    if (relatedId) {
      console.log(`활동 관련 ID: ${relatedId}`);
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
    
    // 2. 일일 제한 확인
    if (activityCount && DAILY_LIMITS[activityType].count > 0 && 
        activityCount >= DAILY_LIMITS[activityType].count) {
      // 일일 제한에 도달한 경우 (로그만 남기고 에러는 리턴하지 않음)
      console.log(`사용자(${userId})가 ${activityType} 활동 제한에 도달했습니다.`);
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
    
    // 5. 보상 내역 기록 - 경험치 히스토리
    try {
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
    } catch (insertError) {
      console.error('경험치 기록 저장 중 예외 발생:', insertError);
      return { success: false, error: '경험치 기록 저장 중 예외가 발생했습니다.' };
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
    
    console.log(`사용자(${userId})에게 ${activityType} 활동 보상 지급: EXP +${expReward}, Points +${pointsReward}`);
    return { success: true };
  } catch (error) {
    console.error('활동 보상 처리 중 예외 발생:', error);
    return { success: false, error: '보상 처리 중 오류가 발생했습니다.' };
  }
}

// 연속 로그인 보상 체크 함수
export async function checkConsecutiveLogin(userId: string): Promise<{ consecutive: number, reward: boolean }> {
  try {
    const supabase = createClient();
    
    // 1. 유저의 마지막 로그인 기록 조회
    const { data: loginHistories, error: historyError } = await supabase
      .from('exp_history')
      .select('created_at')
      .eq('user_id', userId)
      .eq('reason', ACTIVITY_REWARDS[ActivityType.DAILY_LOGIN].reason)
      .order('created_at', { ascending: false })
      .limit(7); // 최대 일주일치만 확인
      
    if (historyError || !loginHistories || loginHistories.length === 0) {
      return { consecutive: 0, reward: false };
    }
    
    // 2. 마지막 로그인 날짜 (시간 정보 제거하고 날짜만 비교)
    const lastLoginDate = new Date(loginHistories[0].created_at);
    const lastLoginDay = new Date(
      lastLoginDate.getFullYear(), 
      lastLoginDate.getMonth(), 
      lastLoginDate.getDate()
    );
    
    // 3. 연속 로그인 계산 (날짜 객체로 직접 비교)
    let consecutiveDays = 1;
    
    for (let i = 1; i < loginHistories.length; i++) {
      const currentLoginDate = new Date(loginHistories[i].created_at);
      const currentLoginDay = new Date(
        currentLoginDate.getFullYear(),
        currentLoginDate.getMonth(),
        currentLoginDate.getDate()
      );
      
      // 이전 날짜 계산 (마지막 로그인 날짜에서 i일 전)
      const expectedDay = new Date(lastLoginDay);
      expectedDay.setDate(lastLoginDay.getDate() - i);
      
      // 날짜 비교 (시간 제외)
      if (
        currentLoginDay.getFullYear() === expectedDay.getFullYear() && 
        currentLoginDay.getMonth() === expectedDay.getMonth() && 
        currentLoginDay.getDate() === expectedDay.getDate()
      ) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    // 4. 7일 연속 로그인인 경우 보상 지급
    const reward = consecutiveDays >= 7;
    
    return { consecutive: consecutiveDays, reward };
  } catch (error) {
    console.error('연속 로그인 확인 중 오류:', error);
    return { consecutive: 0, reward: false };
  }
} 
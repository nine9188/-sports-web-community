'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { rewardUserActivity, getActivityTypeValues } from './activity-actions';
import { getConsecutiveBonus, CONSECUTIVE_LOGIN_BONUSES } from '@/shared/constants/rewards';
import { createLevelUpNotification } from '@/domains/notifications/actions/create';
import { calculateLevelFromExp } from '@/shared/utils/level-icons-server';

// 응답 타입 정의
export interface AttendanceResult {
  success: boolean;
  isFirstLoginToday: boolean;
  consecutiveDays: number;
  todayAttended: boolean;
  bonusAwarded?: {
    exp: number;
    points: number;
    label: string;
  };
  error?: string;
}

export interface LoginHistoryItem {
  login_date: string;
}

export interface AttendanceData {
  loginHistory: LoginHistoryItem[];
  consecutiveDays: number;
  todayAttended: boolean;
  nextBonus: {
    days: number;
    daysRemaining: number;
    exp: number;
    points: number;
    label: string;
  } | null;
}

/**
 * 일일 출석 기록 및 보상
 */
export async function recordDailyLogin(userId: string): Promise<AttendanceResult> {
  try {
    const supabase = await getSupabaseServer();
    const today = new Date().toISOString().split('T')[0];

    // 1. 오늘 이미 로그인했는지 확인
    const { data: existingLogin } = await supabase
      .from('login_history')
      .select('id')
      .eq('user_id', userId)
      .eq('login_date', today)
      .maybeSingle();

    if (existingLogin) {
      // 이미 오늘 출석함 - 연속 출석 일수만 반환
      const consecutiveDays = await calculateConsecutiveDays(userId);
      return {
        success: true,
        isFirstLoginToday: false,
        consecutiveDays,
        todayAttended: true,
      };
    }

    // 2. 오늘 로그인 기록 추가
    const { error: insertError } = await supabase
      .from('login_history')
      .insert({ user_id: userId, login_date: today });

    if (insertError) {
      console.error('출석 기록 추가 오류:', insertError);
      return {
        success: false,
        isFirstLoginToday: false,
        consecutiveDays: 0,
        todayAttended: false,
        error: '출석 기록에 실패했습니다.',
      };
    }

    // 3. 연속 출석 일수 계산
    const consecutiveDays = await calculateConsecutiveDays(userId);

    // 4. 일일 로그인 보상 지급
    const activityTypes = await getActivityTypeValues();
    await rewardUserActivity(userId, activityTypes.DAILY_LOGIN);

    // 5. 연속 출석 보너스 확인 및 지급
    const bonus = getConsecutiveBonus(consecutiveDays);
    let bonusAwarded: AttendanceResult['bonusAwarded'] = undefined;

    if (bonus) {
      await grantConsecutiveBonus(userId, bonus.exp, bonus.points, bonus.label);
      bonusAwarded = {
        exp: bonus.exp,
        points: bonus.points,
        label: bonus.label,
      };
    }

    return {
      success: true,
      isFirstLoginToday: true,
      consecutiveDays,
      todayAttended: true,
      bonusAwarded,
    };
  } catch (error) {
    console.error('일일 출석 기록 오류:', error);
    return {
      success: false,
      isFirstLoginToday: false,
      consecutiveDays: 0,
      todayAttended: false,
      error: '출석 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 연속 출석 일수 계산
 */
async function calculateConsecutiveDays(userId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // 최근 60일간 로그인 기록 조회 (내림차순)
  const { data: logins, error } = await supabase
    .from('login_history')
    .select('login_date')
    .eq('user_id', userId)
    .order('login_date', { ascending: false })
    .limit(60);

  if (error || !logins || logins.length === 0) {
    return 1; // 첫 로그인
  }

  let consecutive = 1;

  for (let i = 1; i < logins.length; i++) {
    const currentDate = new Date(logins[i - 1].login_date);
    const prevDate = new Date(logins[i].login_date);

    // 날짜 차이 계산 (일 단위)
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      consecutive++;
    } else {
      break; // 연속이 끊김
    }
  }

  return consecutive;
}

/**
 * 연속 출석 보너스 지급
 */
async function grantConsecutiveBonus(
  userId: string,
  exp: number,
  points: number,
  reason: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  // 경험치 히스토리 기록
  await supabase.from('exp_history').insert({
    user_id: userId,
    exp,
    reason,
  });

  // 포인트 히스토리 기록
  await supabase.from('point_history').insert({
    user_id: userId,
    points,
    reason,
  });

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('exp, points, level')
    .eq('id', userId)
    .single();

  if (profile) {
    const newExp = (profile.exp || 0) + exp;
    const newPoints = (profile.points || 0) + points;
    const newLevel = calculateLevelFromExp(newExp);

    // 프로필 업데이트
    await supabase
      .from('profiles')
      .update({ exp: newExp, points: newPoints, level: newLevel })
      .eq('id', userId);

    // 레벨업 알림
    if (newLevel > (profile.level || 1)) {
      await createLevelUpNotification({ userId, newLevel });
    }
  }
}

/**
 * 사용자 출석 데이터 조회 (캘린더용)
 */
export async function getAttendanceData(userId: string, year?: number, month?: number): Promise<AttendanceData> {
  const supabase = await getSupabaseServer();
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;

  // 해당 월의 시작일과 종료일
  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

  // 해당 월 출석 기록 조회
  const { data: logins, error } = await supabase
    .from('login_history')
    .select('login_date')
    .eq('user_id', userId)
    .gte('login_date', startDate)
    .lte('login_date', endDate)
    .order('login_date', { ascending: true });

  if (error) {
    console.error('출석 기록 조회 오류:', error);
    return {
      loginHistory: [],
      consecutiveDays: 0,
      todayAttended: false,
      nextBonus: null,
    };
  }

  // 연속 출석 일수 계산
  const consecutiveDays = await calculateConsecutiveDays(userId);

  // 오늘 출석 여부
  const today = now.toISOString().split('T')[0];
  const todayAttended = logins?.some(l => l.login_date === today) || false;

  // 다음 보너스 계산
  const nextBonus = calculateNextBonus(consecutiveDays);

  return {
    loginHistory: logins || [],
    consecutiveDays,
    todayAttended,
    nextBonus,
  };
}

/**
 * 다음 연속 출석 보너스 계산
 */
function calculateNextBonus(consecutiveDays: number): AttendanceData['nextBonus'] {
  for (const bonus of CONSECUTIVE_LOGIN_BONUSES) {
    if (consecutiveDays < bonus.days) {
      return {
        days: bonus.days,
        daysRemaining: bonus.days - consecutiveDays,
        exp: bonus.exp,
        points: bonus.points,
        label: bonus.label,
      };
    }
  }

  // 모든 보너스 달성 후 30일 주기로 반복
  const lastBonus = CONSECUTIVE_LOGIN_BONUSES[CONSECUTIVE_LOGIN_BONUSES.length - 1];
  const daysAfterLast = consecutiveDays - lastBonus.days;
  const daysUntilNext = 30 - (daysAfterLast % 30);

  return {
    days: consecutiveDays + daysUntilNext,
    daysRemaining: daysUntilNext,
    exp: lastBonus.exp,
    points: lastBonus.points,
    label: '월간 출석 완료',
  };
}

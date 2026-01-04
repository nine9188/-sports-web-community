'use server';

import { getSupabaseServer, getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { calculateLevelFromExp } from '@/shared/utils/level-icons-server';
import { createLevelUpNotification } from '@/domains/notifications/actions';
import {
  REFERRAL_REWARDS,
  REFERRAL_MILESTONES,
  getReferralMilestone,
  type ReferralMilestone,
} from '@/shared/constants/rewards';

// ============================================
// 타입 정의
// ============================================

export interface ValidateReferralResult {
  valid: boolean;
  referrerId?: string;
  referrerNickname?: string;
  error?: string;
}

export interface ProcessReferralResult {
  success: boolean;
  referrerPoints?: number;
  referrerExp?: number;
  refereePoints?: number;
  refereeExp?: number;
  error?: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  totalExpEarned: number;
  referredBy?: {
    nickname: string;
    public_id: string;
  };
  recentReferrals: {
    nickname: string;
    created_at: string;
    status: string;
  }[];
}

export interface MilestoneCheckResult {
  success: boolean;
  milestoneAwarded?: ReferralMilestone;
  error?: string;
}

// ============================================
// 추천 코드 검증
// ============================================

/**
 * 추천 코드(public_id) 유효성 검증
 * 가입 시 입력한 추천 코드가 유효한지 확인
 */
export async function validateReferralCode(
  code: string,
  currentUserId?: string
): Promise<ValidateReferralResult> {
  try {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: '추천 코드를 입력해주세요.' };
    }

    const trimmedCode = code.trim().toLowerCase();

    // public_id 형식 확인 (8자 hex)
    if (!/^[a-f0-9]{8}$/i.test(trimmedCode)) {
      return { valid: false, error: '유효하지 않은 추천 코드 형식입니다.' };
    }

    const supabase = await getSupabaseServer();

    // 추천인 조회
    const { data: referrer, error } = await supabase
      .from('profiles')
      .select('id, nickname, public_id')
      .eq('public_id', trimmedCode)
      .single();

    if (error || !referrer) {
      return { valid: false, error: '존재하지 않는 추천 코드입니다.' };
    }

    // 자기 자신의 코드인지 확인
    if (currentUserId && referrer.id === currentUserId) {
      return { valid: false, error: '자신의 추천 코드는 사용할 수 없습니다.' };
    }

    return {
      valid: true,
      referrerId: referrer.id,
      referrerNickname: referrer.nickname,
    };
  } catch (error) {
    console.error('추천 코드 검증 오류:', error);
    return { valid: false, error: '추천 코드 검증 중 오류가 발생했습니다.' };
  }
}

// ============================================
// 추천 보상 처리
// ============================================

/**
 * 추천 보상 처리 (회원가입 완료 후 호출)
 * 추천인과 피추천인 모두에게 보상 지급
 */
export async function processReferral(
  refereeId: string,
  referralCode: string
): Promise<ProcessReferralResult> {
  try {
    // Admin 클라이언트 사용 (RLS 우회 - 회원가입 직후 세션이 없을 수 있음)
    const supabase = getSupabaseAdmin();

    // 1. 추천 코드 검증
    const validation = await validateReferralCode(referralCode, refereeId);
    if (!validation.valid || !validation.referrerId) {
      return { success: false, error: validation.error };
    }

    const referrerId = validation.referrerId;

    // 2. 이미 추천 받은 사용자인지 확인
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (existingReferral) {
      return { success: false, error: '이미 추천을 받은 계정입니다.' };
    }

    // 3. 추천 기록 생성
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId,
        status: 'completed',
        referrer_points_awarded: REFERRAL_REWARDS.REFERRER_SIGNUP.points,
        referrer_exp_awarded: REFERRAL_REWARDS.REFERRER_SIGNUP.exp,
        referee_points_awarded: REFERRAL_REWARDS.REFEREE_SIGNUP.points,
        referee_exp_awarded: REFERRAL_REWARDS.REFEREE_SIGNUP.exp,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (referralError) {
      console.error('추천 기록 생성 오류:', referralError);
      return { success: false, error: '추천 기록 생성에 실패했습니다.' };
    }

    // 4. 피추천인 프로필에 referred_by 업데이트
    await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', refereeId);

    // 5. 추천인 referral_count 증가
    await supabase.rpc('increment_referral_count', { user_id: referrerId });

    // 6. 보상 지급 (추천인)
    await grantReferralRewardAdmin(
      supabase,
      referrerId,
      REFERRAL_REWARDS.REFERRER_SIGNUP.points,
      REFERRAL_REWARDS.REFERRER_SIGNUP.exp,
      REFERRAL_REWARDS.REFERRER_SIGNUP.reason
    );

    // 7. 보상 지급 (피추천인)
    await grantReferralRewardAdmin(
      supabase,
      refereeId,
      REFERRAL_REWARDS.REFEREE_SIGNUP.points,
      REFERRAL_REWARDS.REFEREE_SIGNUP.exp,
      REFERRAL_REWARDS.REFEREE_SIGNUP.reason
    );

    return {
      success: true,
      referrerPoints: REFERRAL_REWARDS.REFERRER_SIGNUP.points,
      referrerExp: REFERRAL_REWARDS.REFERRER_SIGNUP.exp,
      refereePoints: REFERRAL_REWARDS.REFEREE_SIGNUP.points,
      refereeExp: REFERRAL_REWARDS.REFEREE_SIGNUP.exp,
    };
  } catch (error) {
    console.error('추천 처리 오류:', error);
    return { success: false, error: '추천 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 보상 지급 헬퍼 함수 (Admin 클라이언트 사용)
 */
async function grantReferralRewardAdmin(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  points: number,
  exp: number,
  reason: string
): Promise<void> {
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

    // 레벨업 알림은 별도로 처리 (admin 클라이언트로는 알림 생성 어려움)
  }
}

/**
 * 보상 지급 헬퍼 함수 (일반 - 마일스톤용)
 */
async function grantReferralReward(
  userId: string,
  points: number,
  exp: number,
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

// ============================================
// 마일스톤 체크 및 보상
// ============================================

/**
 * 마일스톤 달성 확인 및 보상 지급
 * 피추천인이 특정 활동을 완료했을 때 호출
 */
export async function checkReferralMilestone(
  refereeId: string,
  milestoneType: ReferralMilestone['type']
): Promise<MilestoneCheckResult> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 피추천인의 추천 기록 조회
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('id, referrer_id, status')
      .eq('referee_id', refereeId)
      .eq('status', 'completed')
      .maybeSingle();

    if (referralError || !referral) {
      // 추천으로 가입한 사용자가 아님
      return { success: true };
    }

    // 2. 해당 마일스톤이 이미 지급되었는지 확인
    const { data: existingMilestone } = await supabase
      .from('referral_milestones')
      .select('id')
      .eq('referral_id', referral.id)
      .eq('milestone_type', milestoneType)
      .maybeSingle();

    if (existingMilestone) {
      // 이미 지급됨
      return { success: true };
    }

    // 3. 마일스톤 보상 정보 가져오기
    const milestone = getReferralMilestone(milestoneType);
    if (!milestone) {
      return { success: false, error: '존재하지 않는 마일스톤입니다.' };
    }

    // 4. 마일스톤 기록 생성
    const { error: insertError } = await supabase
      .from('referral_milestones')
      .insert({
        referral_id: referral.id,
        milestone_type: milestoneType,
        points_awarded: milestone.points,
        exp_awarded: milestone.exp,
      });

    if (insertError) {
      console.error('마일스톤 기록 오류:', insertError);
      return { success: false, error: '마일스톤 기록에 실패했습니다.' };
    }

    // 5. 추천인에게 보상 지급
    await grantReferralReward(
      referral.referrer_id,
      milestone.points,
      milestone.exp,
      milestone.description
    );

    return {
      success: true,
      milestoneAwarded: milestone,
    };
  } catch (error) {
    console.error('마일스톤 체크 오류:', error);
    return { success: false, error: '마일스톤 확인 중 오류가 발생했습니다.' };
  }
}

// ============================================
// 추천 통계 조회
// ============================================

/**
 * 사용자의 추천 통계 조회 (프로필 페이지용)
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 사용자 프로필에서 public_id와 referred_by 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('public_id, referred_by, referral_count')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // 2. 추천한 사용자 목록 조회
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        created_at,
        referrer_points_awarded,
        referrer_exp_awarded,
        referee:referee_id (nickname)
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (referralsError) {
      console.error('추천 목록 조회 오류:', referralsError);
    }

    // 3. 마일스톤 보상 합계 조회
    const { data: milestones } = await supabase
      .from('referral_milestones')
      .select('points_awarded, exp_awarded')
      .in(
        'referral_id',
        (referrals || []).map(r => r.id)
      );

    // 4. 총 포인트/경험치 계산
    let totalPoints = 0;
    let totalExp = 0;

    // 기본 추천 보상
    (referrals || []).forEach(r => {
      if (r.status === 'completed') {
        totalPoints += r.referrer_points_awarded || 0;
        totalExp += r.referrer_exp_awarded || 0;
      }
    });

    // 마일스톤 보상
    (milestones || []).forEach(m => {
      totalPoints += m.points_awarded || 0;
      totalExp += m.exp_awarded || 0;
    });

    // 5. 추천인 정보 조회 (나를 추천한 사람)
    let referredBy: ReferralStats['referredBy'] = undefined;
    if (profile.referred_by) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('nickname, public_id')
        .eq('id', profile.referred_by)
        .single();

      if (referrer) {
        referredBy = {
          nickname: referrer.nickname,
          public_id: referrer.public_id,
        };
      }
    }

    // 6. 결과 반환
    return {
      referralCode: profile.public_id,
      totalReferrals: referrals?.length || 0,
      completedReferrals: (referrals || []).filter(r => r.status === 'completed').length,
      totalPointsEarned: totalPoints,
      totalExpEarned: totalExp,
      referredBy,
      recentReferrals: (referrals || []).map(r => ({
        nickname: (r.referee as { nickname: string })?.nickname || '알 수 없음',
        created_at: r.created_at,
        status: r.status,
      })),
    };
  } catch (error) {
    console.error('추천 통계 조회 오류:', error);
    return null;
  }
}

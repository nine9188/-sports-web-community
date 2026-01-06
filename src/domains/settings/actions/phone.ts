'use server';

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server';
import { SolapiMessageService } from 'solapi';
import { createNotification, createLevelUpNotification } from '@/domains/notifications/actions/create';
import { calculateLevelFromExp } from '@/shared/utils/level-icons-server';

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';
const SOLAPI_SENDER_NUMBER = process.env.SOLAPI_SENDER_NUMBER || '';

// OTP 유효시간 (3분)
const OTP_EXPIRY_MINUTES = 3;
// 최대 시도 횟수
const MAX_ATTEMPTS = 5;
// 재발송 대기시간 (60초)
const RESEND_COOLDOWN_SECONDS = 60;
// 전화번호 인증 보상 포인트
const VERIFICATION_REWARD_POINTS = 500;
// 전화번호 인증 보상 경험치
const VERIFICATION_REWARD_EXP = 100;

// 6자리 랜덤 OTP 생성
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 전화번호 포맷 정규화 (하이픈 제거)
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 전화번호 유효성 검사
function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return { valid: false, error: '전화번호를 입력해주세요.' };
  }

  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
  const phoneRegex = /^01[0-9]{8,9}$/;
  if (!phoneRegex.test(normalized)) {
    return { valid: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' };
  }

  return { valid: true };
}

// 전화번호 인증번호 발송
export async function sendPhoneVerificationCode(phoneNumber: string): Promise<{
  success: boolean;
  error?: string;
  expiresAt?: string;
}> {
  try {
    const supabase = await getSupabaseAction();

    // 로그인 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 전화번호 유효성 검사
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // 이미 인증된 전화번호인지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('phone_number, phone_verified')
      .eq('phone_number', normalizedPhone)
      .eq('phone_verified', true)
      .neq('id', user.id)
      .limit(1)
      .single();

    if (existingProfile) {
      return { success: false, error: '이미 다른 계정에서 인증된 전화번호입니다.' };
    }

    // 현재 사용자가 이미 전화번호 인증을 완료했는지 확인
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('phone_verified')
      .eq('id', user.id)
      .single();

    if (userProfile?.phone_verified) {
      return { success: false, error: '이미 전화번호 인증을 완료하셨습니다.' };
    }

    // 최근 발송된 OTP 확인 (쿨다운)
    const cooldownTime = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentOTP } = await supabase
      .from('phone_verifications')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('phone_number', normalizedPhone)
      .gt('created_at', cooldownTime)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentOTP) {
      const waitTime = Math.ceil(
        (new Date(recentOTP.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      return { success: false, error: `${waitTime}초 후에 다시 시도해주세요.` };
    }

    // OTP 생성
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 기존 미인증 OTP 삭제
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('verified', false);

    // 새 OTP 저장
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: user.id,
        phone_number: normalizedPhone,
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error('OTP 저장 실패:', insertError);
      return { success: false, error: '인증번호 생성에 실패했습니다.' };
    }

    // SOLAPI로 SMS 발송
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_NUMBER) {
      console.error('SOLAPI 환경변수가 설정되지 않았습니다.');
      return { success: false, error: 'SMS 서비스 설정이 필요합니다.' };
    }

    const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    try {
      await messageService.send({
        to: normalizedPhone,
        from: SOLAPI_SENDER_NUMBER,
        text: `[4590 Football] 인증번호: ${code}\n${OTP_EXPIRY_MINUTES}분 내에 입력해주세요.`,
      });
    } catch (smsError) {
      console.error('SMS 발송 실패:', smsError);
      // OTP 삭제
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', user.id)
        .eq('code', code);
      return { success: false, error: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }

    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('전화번호 인증 발송 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 전화번호 인증번호 확인
export async function verifyPhoneCode(phoneNumber: string, code: string): Promise<{
  success: boolean;
  error?: string;
  reward?: {
    points: number;
    exp: number;
  };
}> {
  try {
    const supabase = await getSupabaseAction();

    // 로그인 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // OTP 조회
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone_number', normalizedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return { success: false, error: '인증 요청을 찾을 수 없습니다. 인증번호를 다시 요청해주세요.' };
    }

    // 만료 확인
    if (new Date(verification.expires_at) < new Date()) {
      return { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' };
    }

    // 시도 횟수 확인
    if (verification.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' };
    }

    // 인증번호 확인
    if (verification.code !== code) {
      // 시도 횟수 증가
      await supabase
        .from('phone_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);

      const remaining = MAX_ATTEMPTS - verification.attempts - 1;
      return {
        success: false,
        error: `인증번호가 일치하지 않습니다. (남은 시도: ${remaining}회)`
      };
    }

    // 인증 성공 - OTP 완료 처리
    await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    // 현재 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('exp, points, level')
      .eq('id', user.id)
      .single();

    // 프로필 업데이트 (전화번호 + 보상)
    const currentExp = profile?.exp || 0;
    const currentPoints = profile?.points || 0;
    const currentLevel = profile?.level || 1;

    const newExp = currentExp + VERIFICATION_REWARD_EXP;
    const newPoints = currentPoints + VERIFICATION_REWARD_POINTS;
    const newLevel = calculateLevelFromExp(newExp);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone_number: normalizedPhone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        exp: newExp,
        points: newPoints,
        level: newLevel,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('프로필 업데이트 실패:', profileError);
      return { success: false, error: '프로필 업데이트에 실패했습니다.' };
    }

    // 경험치 히스토리 기록
    await supabase.from('exp_history').insert({
      user_id: user.id,
      exp: VERIFICATION_REWARD_EXP,
      reason: '전화번호 인증 완료 보상',
    });

    // 포인트 히스토리 기록
    await supabase.from('point_history').insert({
      user_id: user.id,
      points: VERIFICATION_REWARD_POINTS,
      reason: '전화번호 인증 완료 보상',
    });

    // 전화번호 인증 완료 알림 생성
    await createNotification({
      userId: user.id,
      actorId: undefined, // 시스템 알림
      type: 'phone_verified',
      title: '전화번호 인증이 완료되었습니다! 📱',
      message: `보상으로 ${VERIFICATION_REWARD_POINTS}P와 ${VERIFICATION_REWARD_EXP}EXP가 지급되었습니다.`,
      link: '/settings/profile',
      metadata: {
        reward_points: VERIFICATION_REWARD_POINTS,
        reward_exp: VERIFICATION_REWARD_EXP,
      }
    });

    // 레벨업 알림
    if (newLevel > currentLevel) {
      await createLevelUpNotification({ userId: user.id, newLevel });
    }

    return {
      success: true,
      reward: {
        points: VERIFICATION_REWARD_POINTS,
        exp: VERIFICATION_REWARD_EXP,
      },
    };
  } catch (error) {
    console.error('전화번호 인증 확인 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

// 현재 전화번호 인증 상태 조회
export async function getPhoneVerificationStatus(): Promise<{
  success: boolean;
  error?: string;
  phoneNumber?: string;
  verified?: boolean;
  verifiedAt?: string;
}> {
  try {
    const supabase = await getSupabaseAction();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number, phone_verified, phone_verified_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: '프로필 조회에 실패했습니다.' };
    }

    return {
      success: true,
      phoneNumber: profile.phone_number || undefined,
      verified: profile.phone_verified || false,
      verifiedAt: profile.phone_verified_at || undefined,
    };
  } catch (error) {
    console.error('전화번호 인증 상태 조회 오류:', error);
    return { success: false, error: '서버 오류가 발생했습니다.' };
  }
}

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import crypto from 'crypto';



/**
 * 6자리 랜덤 인증 코드 생성
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 보안 토큰 생성 (비밀번호 재설정용)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 인증 코드 저장 (데이터베이스)
 */
export async function saveVerificationCode(
  email: string,
  code: string,
  type: 'id_recovery' | 'password_reset' | 'email_verification',
  expiresInMinutes: number = 5
) {
  try {
    const supabase = await getSupabaseServer();
    
    // 기존 코드 무효화 (같은 이메일, 같은 타입)
    await supabase
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('email', email)
      .eq('type', type)
      .is('used_at', null);

    // 새 코드 저장
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const { data, error } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        type,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('인증 코드 저장 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('인증 코드 저장 중 오류:', error);
    return { success: false, error: '인증 코드 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * 인증 코드 검증
 */
export async function verifyCode(
  email: string,
  code: string,
  type: 'id_recovery' | 'password_reset' | 'email_verification'
) {
  try {
    const supabase = await getSupabaseServer();
    
    // 코드 조회
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('type', type)
      .is('used_at', null)
      .single();

    if (error || !data) {
      return { success: false, error: '유효하지 않은 인증 코드입니다.' };
    }

    // 만료 시간 확인
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      return { success: false, error: '인증 코드가 만료되었습니다.' };
    }

    // 코드 사용 처리
    await supabase
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', data.id);

    return { success: true, data };
  } catch (error) {
    console.error('인증 코드 검증 중 오류:', error);
    return { success: false, error: '인증 코드 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * 토큰 검증 (비밀번호 재설정용)
 */
export async function verifyResetToken(token: string) {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('code', token)
      .eq('type', 'password_reset')
      .is('used_at', null)
      .single();

    if (error || !data) {
      return { success: false, error: '유효하지 않은 재설정 링크입니다.' };
    }

    // 만료 시간 확인 (30분)
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      return { success: false, error: '재설정 링크가 만료되었습니다.' };
    }

    return { success: true, email: data.email };
  } catch (error) {
    console.error('토큰 검증 중 오류:', error);
    return { success: false, error: '토큰 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * 토큰 사용 처리 (비밀번호 재설정 완료 시)
 */
export async function useResetToken(token: string) {
  try {
    const supabase = await getSupabaseServer();
    
    const { error } = await supabase
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('code', token)
      .eq('type', 'password_reset');

    if (error) {
      console.error('토큰 사용 처리 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('토큰 사용 처리 중 오류:', error);
    return { success: false, error: '토큰 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 이메일 인증 토큰 검증
 */
export async function verifyEmailToken(token: string) {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('code', token)
      .eq('type', 'email_verification')
      .is('used_at', null)
      .single();

    if (error || !data) {
      return { success: false, error: '유효하지 않은 인증 링크입니다.' };
    }

    // 만료 시간 확인 (24시간)
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      return { success: false, error: '인증 링크가 만료되었습니다.' };
    }

    return { success: true, email: data.email };
  } catch (error) {
    console.error('이메일 토큰 검증 중 오류:', error);
    return { success: false, error: '토큰 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * 이메일 인증 토큰 사용 처리
 */
export async function useEmailToken(token: string) {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('verification_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('code', token)
      .eq('type', 'email_verification');

    if (error) {
      console.error('토큰 사용 처리 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('토큰 사용 처리 중 오류:', error);
    return { success: false, error: '토큰 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 만료된 코드 정리 (정기적으로 실행)
 */
export async function cleanupExpiredCodes() {
  try {
    const supabase = await getSupabaseServer();
    
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('verification_codes')
      .delete()
      .lt('expires_at', now);

    if (error) {
      console.error('만료된 코드 정리 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('만료된 코드 정리 중 오류:', error);
    return { success: false, error: '정리 작업 중 오류가 발생했습니다.' };
  }
} 
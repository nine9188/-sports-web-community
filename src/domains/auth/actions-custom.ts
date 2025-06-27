'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { 
  generateVerificationCode, 
  generateSecureToken, 
  saveVerificationCode, 
  verifyCode, 
  verifyResetToken, 
  useResetToken as markTokenAsUsed 
} from '@/shared/services/verification';
import { sendVerificationCodeEmail, sendPasswordResetEmail } from '@/shared/services/email';

/**
 * 아이디 찾기 - 인증 코드 발송
 */
export async function sendIdRecoveryCode(email: string) {
  try {
    // 이메일로 사용자 존재 확인
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, error: '입력하신 이메일과 일치하는 계정을 찾을 수 없습니다.' };
    }

    // 인증 코드 생성
    const verificationCode = generateVerificationCode();

    // 데이터베이스에 저장
    const saveResult = await saveVerificationCode(email, verificationCode, 'id_recovery', 5);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 이메일 발송
    const emailResult = await sendVerificationCodeEmail(email, verificationCode);
    if (!emailResult.success) {
      return { success: false, error: '인증 코드 이메일 발송에 실패했습니다.' };
    }

    return { 
      success: true, 
      message: '인증 코드가 이메일로 발송되었습니다.'
    };

  } catch (error) {
    console.error('아이디 찾기 코드 발송 오류:', error);
    return { success: false, error: '인증 코드 발송 중 오류가 발생했습니다.' };
  }
}

/**
 * 아이디 찾기 - 인증 코드 검증 및 아이디 반환
 */
export async function findUsernameWithCode(email: string, code: string) {
  try {
    // 인증 코드 검증
    const verifyResult = await verifyCode(email, code, 'id_recovery');
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error };
    }

    // 사용자 정보 조회
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('사용자 조회 오류:', error);
      return { success: false, error: '계정 정보를 찾을 수 없습니다.' };
    }

    // 디버깅용 로그
    console.log('조회된 사용자 정보:', {
      username: user.username,
      full_name: user.full_name,
      email: email
    });

    // 마지막 접속일 (임시 정보)
    const lastAccess = '정보 없음';

    const result = {
      success: true,
      username: user.username || '',
      fullName: user.full_name || '',
      lastAccess
    };

    console.log('반환할 결과:', result);
    return result;

  } catch (error) {
    console.error('아이디 찾기 검증 오류:', error);
    return { success: false, error: '아이디 찾기 중 오류가 발생했습니다.' };
  }
}

/**
 * 비밀번호 재설정 - 재설정 링크 발송
 */
export async function sendPasswordResetLink(username: string) {
  try {
    // 아이디로 사용자 조회
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('email, username, full_name')
      .eq('username', username)
      .single();

    if (error || !user) {
      return { success: false, error: '입력하신 아이디와 일치하는 계정을 찾을 수 없습니다.' };
    }

    // 보안 토큰 생성
    const resetToken = generateSecureToken();

    // 데이터베이스에 저장 (30분 유효)
    const saveResult = await saveVerificationCode(user.email || '', resetToken, 'password_reset', 30);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 이메일 발송
    const emailResult = await sendPasswordResetEmail(user.email || '', resetToken, user.username || '');
    if (!emailResult.success) {
      return { success: false, error: '재설정 링크 이메일 발송에 실패했습니다.' };
    }

    return { 
      success: true, 
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다.',
      email: user.email
    };

  } catch (error) {
    console.error('비밀번호 재설정 링크 발송 오류:', error);
    return { success: false, error: '비밀번호 재설정 링크 발송 중 오류가 발생했습니다.' };
  }
}

/**
 * 비밀번호 재설정 - 토큰 검증
 */
export async function validateResetToken(token: string) {
  try {
    const result = await verifyResetToken(token);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { 
      success: true, 
      email: result.email 
    };

  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return { success: false, error: '토큰 검증 중 오류가 발생했습니다.' };
  }
}

/**
 * 비밀번호 재설정 - 새 비밀번호 설정
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    // 토큰 검증
    const tokenResult = await verifyResetToken(token);
    if (!tokenResult.success) {
      return { success: false, error: tokenResult.error };
    }

    const email = tokenResult.email;

    // Supabase Auth를 통한 비밀번호 업데이트
    const supabase = await createClient();
    
    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email!)
      .single();

    if (userError || !user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    // 비밀번호 업데이트 (관리자 권한 필요할 수 있음)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError);
      return { success: false, error: '비밀번호 변경에 실패했습니다.' };
    }

    // 토큰 사용 처리
    const tokenUseResult = await markTokenAsUsed(token);
    if (!tokenUseResult.success) {
      console.error('토큰 사용 처리 실패:', tokenUseResult.error);
    }

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };

  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return { success: false, error: '비밀번호 재설정 중 오류가 발생했습니다.' };
  }
} 
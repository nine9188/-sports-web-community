'use server';

import { sendSignupOtpEmail } from '@/shared/services/email';
import { generateVerificationCode, saveVerificationCode, verifyCode } from '@/shared/services/verification';

export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email) {
      return { success: false, error: '이메일을 입력해주세요.' };
    }

    const code = generateVerificationCode();

    const saveResult = await saveVerificationCode(email, code, 'email_verification', 5);
    if (!saveResult.success) {
      return { success: false, error: '인증번호 생성에 실패했습니다.' };
    }

    const emailResult = await sendSignupOtpEmail(email, code);
    if (!emailResult.success) {
      return { success: false, error: '인증번호 발송에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('이메일 OTP 발송 오류:', error);
    return { success: false, error: '인증번호 발송 중 오류가 발생했습니다.' };
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email || !token) {
      return { success: false, error: '이메일과 인증번호를 입력해주세요.' };
    }

    const result = await verifyCode(email, token, 'email_verification');
    if (!result.success) {
      return { success: false, error: result.error || '인증번호가 올바르지 않습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('이메일 OTP 인증 오류:', error);
    return { success: false, error: '인증 처리 중 오류가 발생했습니다.' };
  }
}

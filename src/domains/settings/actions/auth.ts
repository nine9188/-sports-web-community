'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server';
import { headers } from 'next/headers';
import { logAuthEvent } from '@/shared/actions/log-actions';

/**
 * 사용자 인증을 확인하고, 인증되지 않은 경우 지정된 경로로 리다이렉트하는 함수
 *
 * Server Component와 Server Action 모두에서 사용 가능합니다.
 * Server Component에서 호출 시 자동으로 읽기 전용 클라이언트를 사용합니다.
 *
 * @param redirectTo 인증되지 않은 경우 리다이렉트할 경로 (기본값: /auth/signin)
 * @returns 인증된 사용자 정보
 */
export async function checkUserAuth(redirectTo = '/auth/signin') {
  try {
    // Server Component에서는 getSupabaseServer() 사용 (읽기 전용)
    const supabase = await getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('인증 확인 오류:', error);
      redirect(redirectTo);
    }

    return user;
  } catch (error) {
    console.error('사용자 인증 확인 중 오류 발생:', error);
    redirect(redirectTo);
  }
}

/**
 * 비밀번호 변경 Server Action
 *
 * Supabase는 updateUser()로 비밀번호 변경 시 자동으로 새 세션을 발급합니다.
 * 추가 보안을 위해 Turnstile 봇 검증을 사용합니다.
 */
export async function changePassword(
  newPassword: string,
  turnstileToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 필드 검증
    if (!newPassword) {
      return { success: false, error: '새 비밀번호를 입력해주세요.' };
    }

    // 새 비밀번호 길이 검증
    if (newPassword.length < 8) {
      return { success: false, error: '새 비밀번호는 최소 8자 이상이어야 합니다.' };
    }

    // Turnstile 토큰 검증
    if (!turnstileToken) {
      return { success: false, error: '봇 검증을 완료해주세요.' };
    }
    const secret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;
    if (!secret) {
      return { success: false, error: '서버 설정 오류: 캡차 비밀키가 없습니다.' };
    }
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim();
    const body = new URLSearchParams({
      secret,
      response: turnstileToken,
    });
    if (ip) body.set('remoteip', ip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const verify = await resp.json();
    if (!verify?.success) {
      return { success: false, error: '봇 검증에 실패했습니다. 새로고침 후 다시 시도해주세요.' };
    }

    // Supabase 클라이언트 생성
    const supabase = await getSupabaseAction();

    // 사용자 정보 확인 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();

    // 로그인 상태 확인
    if (!user || error) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // OAuth 계정은 비밀번호 변경 불가
    const provider = user.app_metadata?.provider;
    if (provider && provider !== 'email') {
      return { success: false, error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' };
    }

    // 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError);

      // 에러 메시지 한글화
      let errorMessage = '비밀번호 변경에 실패했습니다.';

      if (updateError.message.includes('same password') || updateError.code === 'same_password') {
        errorMessage = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      } else if (updateError.message.includes('Password')) {
        errorMessage = '비밀번호 형식이 올바르지 않습니다.';
      }

      // 실패 로그 기록
      await logAuthEvent(
        'PASSWORD_CHANGE_FAILED',
        `비밀번호 변경 실패: ${updateError.message}`,
        user.id,
        false,
        { error: updateError.message, code: updateError.code }
      );

      return { success: false, error: errorMessage };
    }

    // 성공 로그 기록
    await logAuthEvent(
      'PASSWORD_CHANGE_SUCCESS',
      '비밀번호 변경 성공',
      user.id,
      true,
      { userId: user.id, email: user.email }
    );

    // 비밀번호 변경 성공 (Supabase가 자동으로 새 세션 발급)
    return { success: true };
  } catch (error: unknown) {
    console.error('비밀번호 변경 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해주세요.';
    return {
      success: false,
      error: errorMessage
    };
  }
}

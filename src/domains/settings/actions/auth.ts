'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

/**
 * 사용자 인증을 확인하고, 인증되지 않은 경우 지정된 경로로 리다이렉트하는 함수
 * @param redirectTo 인증되지 않은 경우 리다이렉트할 경로 (기본값: /auth/signin)
 * @returns 인증된 사용자 정보
 */
export async function checkUserAuth(redirectTo = '/auth/signin') {
  try {
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
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  turnstileToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 필드 검증
    if (!currentPassword || !newPassword) {
      return { success: false, error: '모든 필드를 입력해주세요.' };
    }

    // 새 비밀번호 길이 검증
    if (newPassword.length < 8) {
      return { success: false, error: '새 비밀번호는 최소 8자 이상이어야 합니다.' };
    }

    // 현재 비밀번호와 새 비밀번호가 같은지 검증
    if (currentPassword === newPassword) {
      return { success: false, error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' };
    }

    // Turnstile 토큰 검증
    if (!turnstileToken) {
      return { success: false, error: '봇 검증을 완료해주세요.' };
    }
    const secret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;
    if (!secret) {
      return { success: false, error: '서버 설정 오류: 캡차 비밀키가 없습니다.' };
    }
    const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim();
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
    const supabase = await getSupabaseServer();
    
    // 사용자 정보 확인 (getUser 사용 - 보안 강화)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 로그인 상태 확인
    if (!user || error) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 1. 현재 비밀번호 확인 (signInWithPassword로 검증)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email as string,
      password: currentPassword,
    });
    
    if (signInError) {
      return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' };
    }
    
    // 2. 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (updateError) {
      throw updateError;
    }
    
    // 경로 재검증
    revalidatePath('/settings/password');
    
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

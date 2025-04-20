'use server';

import { createClient } from '@/app/lib/supabase.server';
import { revalidatePath } from 'next/cache';

// 비밀번호 변경 Server Action
export async function changePassword(
  currentPassword: string,
  newPassword: string
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

    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
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
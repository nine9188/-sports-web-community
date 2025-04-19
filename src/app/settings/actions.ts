'use server';

import { createClient } from '@/app/lib/supabase.server';
import { revalidatePath } from 'next/cache';

interface ProfileUpdateData {
  nickname: string;
  full_name?: string;
  username?: string;
  icon_id?: number | null;
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 필드 검증
    if (!data.nickname || data.nickname.trim().length < 2) {
      return { success: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
    }

    if (data.username && data.username.trim().length > 0) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(data.username)) {
        return { 
          success: false, 
          error: '사용자 이름은 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.' 
        };
      }
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 사용자 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    // 권한 확인
    if (!session || session.user.id !== userId) {
      return { success: false, error: '권한이 없습니다.' };
    }
    
    // 프로필 업데이트
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: data.nickname,
        full_name: data.full_name || null,
        username: data.username || null,
        icon_id: data.icon_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    // 페이지 캐시 갱신
    revalidatePath('/settings/profile');
    
    return { success: true };
  } catch (error: unknown) {
    console.error('프로필 업데이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다. 다시 시도해주세요.';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
} 
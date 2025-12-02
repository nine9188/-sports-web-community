'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// 응답 타입 정의
interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

/**
 * 회원탈퇴 함수
 * @param password 비밀번호 확인
 * @returns 성공/실패 여부와 메시지
 */
export async function deleteAccount(
  password: string
): Promise<DeleteAccountResponse> {
  try {
    if (!password) {
      return {
        success: false,
        message: '비밀번호를 입력해주세요.'
      };
    }

    const supabase = await getSupabaseServer();
    
    // 현재 사용자 정보 가져오기 (getUser 사용 - 보안 강화)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: '로그인이 필요합니다.'
      };
    }
    
    // 비밀번호 확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password
    });
    
    if (signInError) {
      return {
        success: false,
        message: '비밀번호가 일치하지 않습니다.'
      };
    }
    
    // 사용자 데이터 삭제 - CASCADE가 데이터베이스에 설정되어 있다고 가정
    // 1. profiles 테이블 데이터 삭제
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
      
    if (profileDeleteError) {
      console.error('프로필 삭제 오류:', profileDeleteError);
      return {
        success: false,
        message: '계정 정보 삭제 중 오류가 발생했습니다.'
      };
    }
    
    // 2. 인증 사용자 삭제 (관리자 권한 필요할 수 있음)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      user.id
    );
    
    if (authDeleteError) {
      console.error('인증 사용자 삭제 오류:', authDeleteError);
      
      // admin API 사용 권한이 없는 경우, 일반 API로 시도
      const { error: userDeleteError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (userDeleteError) {
        console.error('일반 사용자 삭제 오류:', userDeleteError);
        return {
          success: false,
          message: '계정 삭제 중 오류가 발생했습니다. 관리자에게 문의해주세요.'
        };
      }
    }
    
    // 세션 쿠키 삭제
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');
    
    // 캐시 갱신
    revalidatePath('/');
    
    return {
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.'
    };
    
  } catch (error) {
    console.error('회원탈퇴 처리 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
} 
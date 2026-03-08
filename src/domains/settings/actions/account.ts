'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 응답 타입 정의
interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

/**
 * 회원탈퇴 함수 (소프트 삭제)
 * - DB에 데이터는 보존, 화면에서만 안 보이게 처리
 * - profiles.is_deleted = true, 게시글/댓글 is_hidden = true
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

    // 1. 프로필 소프트 삭제 (is_deleted = true)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('프로필 소프트 삭제 오류:', profileError);
      return {
        success: false,
        message: '계정 삭제 처리 중 오류가 발생했습니다.'
      };
    }

    // 2. 해당 유저의 게시글 소프트 삭제
    await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('user_id', user.id);

    // 3. 해당 유저의 댓글 소프트 삭제
    await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('user_id', user.id);

    // 4. 세션 로그아웃
    await supabase.auth.signOut();

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
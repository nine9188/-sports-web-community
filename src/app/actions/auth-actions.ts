'use server';

import { createClient } from "@/app/lib/supabase.server";
import { HeaderUserData } from '@/app/lib/types';
import { getUserIconInfoServer } from '@/app/utils/level-icons-server';

/**
 * 토큰 갱신 서버 액션
 * 클라이언트에서 사용자 인증 상태가 변경되었을 때 쿠키를 적절히 업데이트
 */
export async function refreshSession(refreshToken: string) {
  const supabase = await createClient();

  // 리프레시 토큰으로 세션 갱신
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("세션 갱신 중 오류 발생:", error);
    return { success: false, error: error.message };
  }

  return { success: true, session: data.session };
}

/**
 * 사용자 정보 업데이트 서버 액션
 */
export async function updateUserData(userId: string, metadata: Record<string, unknown>) {
  const supabase = await createClient();

  // 사용자 인증 정보 확인 (getUser 메서드 사용 - 보안 강화)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // 권한 검증
  if (userError || !user) {
    console.error("사용자 인증 오류:", userError);
    return { success: false, error: '인증되지 않은 사용자입니다.' };
  }
  
  // 요청한 userId와 실제 인증된 userId 일치 여부 확인
  if (user.id !== userId) {
    console.error("권한 오류: 요청 ID와 인증된 ID 불일치");
    return { success: false, error: '권한이 없습니다.' };
  }

  // 사용자 메타데이터 업데이트
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  });

  if (error) {
    console.error("사용자 정보 업데이트 중 오류 발생:", error);
    return { success: false, error: error.message };
  }

  // 프로필 테이블도 업데이트 (필요한 경우)
  if (metadata.icon_id !== undefined) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        icon_id: metadata.icon_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error("프로필 테이블 업데이트 중 오류 발생:", profileError);
      // 메타데이터는 업데이트되었으므로 실패해도 성공으로 처리
    }
  }

  return { success: true, user: data.user };
}

/**
 * 로그아웃 서버 액션
 */
export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("로그아웃 중 오류 발생:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 사용자 프로필 정보 가져오기 서버 액션
 */
export async function getUserProfile() {
  const supabase = await createClient();

  // getUser 메서드 사용 - Supabase Auth 서버와 통신하여 인증된 데이터 가져오기
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { user: null, profile: null };
  }
  
  // 프로필 정보 조회
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error("프로필 정보 조회 중 오류 발생:", error);
    return { user, profile: null };
  }
  
  // 게시글 수 조회
  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  // 댓글 수 조회
  const { count: commentCount } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 사용자 메타데이터에서 아이콘 정보 추출 (있을 경우)
  const userMetadata = user.user_metadata || {};
  const icon_url = userMetadata.icon_url || null;
  
  const profileData = {
    ...profile,
    postCount: postCount || 0,
    commentCount: commentCount || 0,
    // icon_id는 profile 테이블에서 이미 가져온 상태입니다.
    // 메타데이터에서 icon_url 정보를 추가합니다.
    icon_url
  };
  
  return { user, profile: profileData };
}

/**
 * 헤더에 표시할 사용자 정보를 가져오는 서버 액션
 */
export async function getHeaderUserData(): Promise<HeaderUserData | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // 아이콘 정보를 서버에서 빠르게 가져오기
    const iconInfo = await getUserIconInfoServer(user.id);
    
    // 기본 사용자 데이터 구성
    const userData: HeaderUserData = {
      id: user.id,
      email: user.email || '',
      nickname: user.user_metadata?.nickname || '사용자',
      isAdmin: user.user_metadata?.is_admin === true,
      iconInfo: {
        iconId: iconInfo.iconId,
        iconUrl: iconInfo.currentIconUrl,
        iconName: iconInfo.currentIconName
      }
    };
    
    return userData;
  } catch (error) {
    console.error('헤더 사용자 데이터 가져오기 오류:', error);
    return null;
  }
} 
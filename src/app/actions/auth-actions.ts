'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/app/lib/database.types";

/**
 * 토큰 갱신 서버 액션
 * 클라이언트에서 사용자 인증 상태가 변경되었을 때 쿠키를 적절히 업데이트
 */
export async function refreshSession(refreshToken: string) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

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
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

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
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("로그아웃 중 오류 발생:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
} 
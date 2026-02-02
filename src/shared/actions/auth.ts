'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 인증된 사용자 정보를 가져오는 캐시된 함수
 * 같은 request 내에서 여러 번 호출해도 1번만 실행됨
 *
 * @returns AuthResponse from supabase.auth.getUser()
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await getSupabaseServer();
  return supabase.auth.getUser();
});

/**
 * 사용자 기본 프로필 정보 (is_admin 포함)를 가져오는 캐시된 함수
 * 같은 request 내에서 여러 번 호출해도 1번만 실행됨
 *
 * @param userId - 사용자 ID
 * @returns 프로필 데이터 (id, is_admin)
 */
export const getUserAdminStatus = cache(async (userId: string) => {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    return { isAdmin: false };
  }

  return { isAdmin: data?.is_admin || false };
});

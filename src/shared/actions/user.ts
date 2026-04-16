'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getSupabaseServer, getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { FullUserDataWithSession } from '@/shared/types/user';
import { getAuthenticatedUser } from './auth';

/**
 * 유저 통계 (게시글/댓글 수) 캐싱
 *
 * 현재 authenticated role로 매 페이지마다 343만 호출/일 발생 중.
 * 10분 TTL로 99% 이상 감소 예상.
 * 게시글/댓글 작성·삭제 시 revalidateTag(`user-stats-${userId}`) 호출로 즉시 반영.
 */
const _getCachedUserStatsImpl = (userId: string) => unstable_cache(
  async (): Promise<{ postCount: number; commentCount: number }> => {
    const supabase = getSupabaseAdmin();
    const [postCountResult, commentCountResult] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return {
      postCount: postCountResult.count || 0,
      commentCount: commentCountResult.count || 0,
    };
  },
  ['user-stats', userId],
  { revalidate: 600, tags: [`user-stats-${userId}`] }  // 10분
)();

async function getCachedUserStats(userId: string) {
  return _getCachedUserStatsImpl(userId);
}

/**
 * 통합 사용자 데이터 fetch 함수
 * 서버에서 1번만 호출하여 모든 사용자 관련 데이터를 가져옴
 *
 * 포함 데이터:
 * - 프로필 기본 정보 (nickname, email, level, exp, points)
 * - 아이콘 정보 (icon_id, icon_url, icon_name)
 * - 통계 (postCount, commentCount)
 * - 권한 (is_admin)
 * - 세션 정보
 */
/**
 * 프로필 아이콘 업데이트
 */
export async function updateProfileIcon(iconId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ icon_id: iconId })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('프로필 아이콘 업데이트 오류:', error);
    return { success: false, error: '아이콘 업데이트 중 오류가 발생했습니다.' };
  }
}

/**
 * 계정 정지 상태 확인
 */
export async function checkSuspensionStatus(): Promise<{
  is_suspended: boolean;
  suspended_until: string | null;
  suspended_reason: string | null;
} | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_suspended, suspended_until, suspended_reason')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as {
      is_suspended: boolean;
      suspended_until: string | null;
      suspended_reason: string | null;
    };
  } catch (error) {
    console.error('정지 상태 확인 오류:', error);
    return null;
  }
}

/**
 * 사용자 아이콘 정보 조회 (userId 지정)
 * 클라이언트에서 직접 Supabase 쿼리 대신 사용
 */
export async function getUserIconData(userId: string): Promise<{
  iconId: number | null;
  iconUrl: string;
  iconName: string;
  level: number;
  exp: number;
  points: number;
}> {
  const defaultResult = {
    iconId: null,
    iconUrl: getLevelIconUrl(1),
    iconName: '레벨 1 아이콘',
    level: 1,
    exp: 0,
    points: 0,
  };

  if (!userId) return defaultResult;

  try {
    const supabase = await getSupabaseServer();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('icon_id, level, exp, points')
      .eq('id', userId)
      .single();

    if (error || !profile) return defaultResult;

    const level = profile.level || 1;
    const exp = profile.exp || 0;
    const points = profile.points || 0;
    const levelIconUrl = getLevelIconUrl(level);

    if (profile.icon_id) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('id, name, image_url')
        .eq('id', profile.icon_id)
        .single();

      if (iconData?.image_url) {
        return {
          iconId: iconData.id,
          iconUrl: iconData.image_url,
          iconName: iconData.name || `레벨 ${level} 아이콘`,
          level,
          exp,
          points,
        };
      }
    }

    return {
      iconId: null,
      iconUrl: levelIconUrl,
      iconName: `레벨 ${level} 아이콘`,
      level,
      exp,
      points,
    };
  } catch (error) {
    console.error('사용자 아이콘 정보 조회 오류:', error);
    return defaultResult;
  }
}

/**
 * 현재 로그인한 사용자의 아이콘 정보 조회
 */
export async function getCurrentUserIconData(): Promise<{
  iconId: number | null;
  iconUrl: string;
  iconName: string;
  level: number;
} | null> {
  try {
    const { data: { user }, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return null;

    const result = await getUserIconData(user.id);
    return {
      iconId: result.iconId,
      iconUrl: result.iconUrl,
      iconName: result.iconName,
      level: result.level,
    };
  } catch {
    return null;
  }
}

export const getFullUserData = cache(async (): Promise<FullUserDataWithSession | null> => {
  try {
    const supabase = await getSupabaseServer();

    // 1. 인증 확인 (캐시된 함수 사용 - 같은 request 내에서 1번만 호출)
    const { data: { user }, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return null;
    }

    // 2. 모든 데이터 병렬 fetch
    // profile: 자주 변경되는 값(level, exp, points) 포함 → 캐싱 없이 매번 조회
    // userStats: 게시글/댓글 count → unstable_cache 10분 (egress 절감)
    const [profileResult, userStats] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, nickname, email, username, level, exp, points, icon_id, is_admin')
        .eq('id', user.id)
        .single(),
      getCachedUserStats(user.id),
    ]);

    // 프로필 정보 처리
    if (profileResult.error || !profileResult.data) {
      console.error('프로필 정보 조회 오류:', profileResult.error);
      return null;
    }

    const profile = profileResult.data;
    const userLevel = profile.level || 1;

    // 3. 아이콘 정보 가져오기
    let iconUrl: string = getLevelIconUrl(userLevel);
    let iconName: string = `레벨 ${userLevel} 아이콘`;

    if (profile.icon_id) {
      try {
        const { data: iconData } = await supabase
          .from('shop_items')
          .select('image_url, name')
          .eq('id', profile.icon_id)
          .single();

        if (iconData?.image_url) {
          iconUrl = iconData.image_url;
          iconName = iconData.name || iconName;
        }
      } catch {
        // 아이콘 조회 실패 시 레벨 아이콘 유지
      }
    }

    // 4. 통계 데이터 처리 (캐시된 값 사용)
    const { postCount, commentCount } = userStats;

    return {
      id: profile.id,
      email: profile.email || user.email || null,
      nickname: profile.nickname || null,
      username: profile.username || null,
      level: userLevel,
      exp: profile.exp || 0,
      points: profile.points || 0,
      icon_id: profile.icon_id || null,
      icon_url: iconUrl,
      icon_name: iconName,
      postCount,
      commentCount,
      is_admin: profile.is_admin || false,
      session: null
    };
  } catch (error) {
    // 빌드 단계 로그 오염 방지 (DYNAMIC_SERVER_USAGE는 정상 동작)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('사용자 데이터 로드 오류:', error);
    }
    return null;
  }
});

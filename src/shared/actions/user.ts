'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { FullUserDataWithSession } from '@/shared/types/user';
import { getAuthenticatedUser } from './auth';

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
export const getFullUserData = cache(async (): Promise<FullUserDataWithSession | null> => {
  try {
    const supabase = await getSupabaseServer();

    // 1. 인증 확인 (캐시된 함수 사용 - 같은 request 내에서 1번만 호출)
    const { data: { user }, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return null;
    }

    // 2. 모든 데이터 병렬 fetch
    const [profileResult, postCountResult, commentCountResult] = await Promise.all([
      // 프로필 기본 정보
      supabase
        .from('profiles')
        .select('id, nickname, email, username, level, exp, points, icon_id, is_admin')
        .eq('id', user.id)
        .single(),

      // 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // 댓글 수
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
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

    // 4. 통계 데이터 처리
    const postCount = postCountResult.count || 0;
    const commentCount = commentCountResult.count || 0;

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

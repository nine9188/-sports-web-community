'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { PublicProfile, ActionResponse } from '../types';

/**
 * 아이디 마스킹 처리 (예: testuser123 → te******23)
 */
function maskUsername(username: string): string {
  if (!username) return '***';
  if (username.length <= 4) {
    return `${username[0]}**`;
  }
  const start = username.slice(0, 2);
  const end = username.slice(-2);
  const masked = '*'.repeat(Math.min(username.length - 4, 6));
  return `${start}${masked}${end}`;
}

/**
 * public_id로 공개 프로필 정보를 조회합니다.
 * @param publicId 유저의 공개 ID (8자리 영숫자)
 * @returns 공개 프로필 정보
 */
export async function getPublicProfile(
  publicId: string
): Promise<ActionResponse<PublicProfile>> {
  try {
    if (!publicId || publicId.length !== 8) {
      return {
        success: false,
        error: '유효하지 않은 프로필 ID입니다.',
      };
    }

    const supabase = await getSupabaseServer();

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, public_id, nickname, username, icon_id, level, exp, updated_at')
      .eq('public_id', publicId)
      .single();

    if (profileError || !profile) {
      console.error('프로필 조회 오류:', profileError);
      return {
        success: false,
        error: '프로필을 찾을 수 없습니다.',
      };
    }

    // 아이콘 URL 조회 (icon_id가 있는 경우)
    let iconUrl: string | null = null;
    if (profile.icon_id) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', profile.icon_id)
        .single();

      iconUrl = iconData?.image_url || null;
    }

    // icon_url이 없으면 레벨 기반 기본 아이콘 사용
    if (!iconUrl) {
      iconUrl = getLevelIconUrl(profile.level || 1);
    }

    // 게시글 수 조회
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_deleted', false);

    // 댓글 수 조회
    const { count: commentCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_deleted', false);

    // 방문(출석) 횟수 조회 - login_history 테이블에서
    const { count: visitCount } = await supabase
      .from('login_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // 아이디 마스킹 처리 (예: testuser123 → te******23)
    const maskedId = maskUsername(profile.username || '');

    return {
      success: true,
      data: {
        id: profile.id,
        public_id: profile.public_id,
        nickname: profile.nickname || '익명',
        masked_id: maskedId,
        icon_id: profile.icon_id,
        icon_url: iconUrl,
        level: profile.level || 1,
        exp: profile.exp || 0,
        created_at: profile.updated_at,
        post_count: postCount || 0,
        comment_count: commentCount || 0,
        visit_count: visitCount || 0,
      },
    };
  } catch (error) {
    console.error('프로필 조회 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '프로필을 가져오는 중 오류가 발생했습니다.',
    };
  }
}

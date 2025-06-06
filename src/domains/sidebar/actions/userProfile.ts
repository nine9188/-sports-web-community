'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { cache } from 'react';

// 사이드바용 사용자 프로필 데이터 타입
export interface SidebarUserProfile {
  id: string;
  nickname: string | null;
  email: string | null;
  level: number;
  exp: number;
  points: number;
  icon_id: number | null;
  icon_url: string | null;
  icon_name: string | null;
  postCount: number;
  commentCount: number;
  is_admin: boolean | null;
}

/**
 * 사이드바에 표시할 사용자 프로필 데이터를 서버에서 미리 로드
 * 캐싱을 적용하여 성능 최적화
 */
export const getSidebarUserProfile = cache(async (): Promise<SidebarUserProfile | null> => {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }
    
    // 병렬로 데이터 가져오기
    const [profileResult, postCountResult, commentCountResult] = await Promise.allSettled([
      // 1. 프로필 기본 정보
      supabase
        .from('profiles')
        .select('id, nickname, email, level, exp, points, icon_id, is_admin')
        .eq('id', user.id)
        .single(),
      
      // 2. 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // 3. 댓글 수
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
    ]);
    
    // 프로필 정보 처리
    if (profileResult.status === 'rejected' || profileResult.value.error) {
      console.error('프로필 정보 조회 오류:', profileResult.status === 'rejected' ? profileResult.reason : profileResult.value.error);
      return null;
    }
    
    const profile = profileResult.value.data;
    
    // 게시글/댓글 수 처리
    const postCount = postCountResult.status === 'fulfilled' ? (postCountResult.value.count || 0) : 0;
    const commentCount = commentCountResult.status === 'fulfilled' ? (commentCountResult.value.count || 0) : 0;
    
    // 아이콘 정보 가져오기 (icon_id가 있는 경우만)
    let iconUrl: string | null = null;
    let iconName: string | null = null;
    
    if (profile.icon_id) {
      try {
        const { data: iconData } = await supabase
          .from('shop_items')
          .select('image_url, name')
          .eq('id', profile.icon_id)
          .single();
        
        if (iconData) {
          iconUrl = iconData.image_url;
          iconName = iconData.name;
        }
      } catch (iconError) {
  
        // 아이콘 정보를 가져올 수 없어도 계속 진행
      }
    }
    
    return {
      id: profile.id,
      nickname: profile.nickname,
      email: profile.email || user.email || null,
      level: profile.level || 1,
      exp: profile.exp || 0,
      points: profile.points || 0,
      icon_id: profile.icon_id,
      icon_url: iconUrl,
      icon_name: iconName,
      postCount,
      commentCount,
      is_admin: profile.is_admin
    };
    
  } catch (error) {
    console.error('사이드바 사용자 프로필 데이터 로드 오류:', error);
    return null;
  }
}); 
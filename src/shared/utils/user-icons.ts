'use client';

import { createClient } from '@/shared/api/supabase';
import { getLevelIconUrl } from './level-icons';

// 기본 아이콘 URL
const DEFAULT_ICON_URL = '/images/player.svg';
const CACHE_EXPIRY = 5 * 60 * 1000; // 캐시 만료 시간 (5분)

// 아이콘 캐시 - 메모리에 저장
interface IconCacheEntry {
  url: string;
  name: string | null;
  timestamp: number;
}

const iconCache = new Map<string, IconCacheEntry>();

/**
 * 최적화된 아이콘 가져오기 함수
 * PostList.tsx 스타일로 즉시 사용 가능한 아이콘 URL을 반환
 */
export async function getOptimizedUserIcon(
  userId: string | undefined, 
  userLevel?: number
): Promise<{ url: string; name: string | null }> {
  // 유저 ID가 없으면 기본 아이콘 반환
  if (!userId) {
    return { url: DEFAULT_ICON_URL, name: '기본 아이콘' };
  }

  // 캐시 확인
  const cachedIcon = iconCache.get(userId);
  const now = Date.now();
  
  // 캐시가 유효하면 캐시된 값 반환
  if (cachedIcon && (now - cachedIcon.timestamp < CACHE_EXPIRY)) {
    return { url: cachedIcon.url, name: cachedIcon.name };
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient();
    
    // 프로필 정보 조회 (icon_id와 level만 필요)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('icon_id, level')
      .eq('id', userId)
      .single();
    
    if (error) {
      // 에러 발생 시 기본 레벨 아이콘 반환
      const level = userLevel || 1;
      const levelIcon = getLevelIconUrl(level);
      
      // 캐시 업데이트
      iconCache.set(userId, {
        url: levelIcon,
        name: `레벨 ${level} 아이콘`,
        timestamp: now
      });
      
      return { url: levelIcon, name: `레벨 ${level} 아이콘` };
    }
    
    // 사용자가 아이콘을 선택했는지 확인
    if (profile?.icon_id) {
      // 선택한 아이콘 정보 조회
      const { data: iconData, error: iconError } = await supabase
        .from('shop_items')
        .select('image_url, name')
        .eq('id', profile.icon_id)
        .single();
      
      if (!iconError && iconData?.image_url) {
        // 캐시 업데이트
        iconCache.set(userId, {
          url: iconData.image_url,
          name: iconData.name || null,
          timestamp: now
        });
        
        return { url: iconData.image_url, name: iconData.name || null };
      }
    }
    
    // 선택한 아이콘이 없거나 조회 실패 시 레벨 아이콘 사용
    const level = profile?.level || userLevel || 1;
    const levelIcon = getLevelIconUrl(level);
    
    // 캐시 업데이트
    iconCache.set(userId, {
      url: levelIcon,
      name: `레벨 ${level} 아이콘`,
      timestamp: now
    });
    
    return { url: levelIcon, name: `레벨 ${level} 아이콘` };
  } catch (error) {
    console.error('최적화된 아이콘 조회 오류:', error);
    
    // 오류 발생 시 기본 레벨 아이콘 반환
    const level = userLevel || 1;
    const levelIcon = getLevelIconUrl(level);
    
    return { url: levelIcon, name: `레벨 ${level} 아이콘` };
  }
}

/**
 * 레벨에 기반한 기본 아이콘 URL을 즉시 반환하는 함수
 */
export function getUserLevelIconUrl(level: number = 1): string {
  return getLevelIconUrl(Math.max(1, level));
} 
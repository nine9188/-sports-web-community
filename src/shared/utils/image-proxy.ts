/**
 * API-Sports 이미지 URL을 생성하고 Supabase Storage 캐싱을 관리하는 유틸리티 함수들
 */

import { ImageType } from '@/shared/types/image';

// 클라이언트 메모리 캐시 (중복 요청 방지)
const imageUrlCache = new Map<string, string | null>();

// API-Sports.io 기본 URL
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football';

/**
 * API-Sports 이미지 URL 생성 (직접 URL)
 * 
 * @param type - 이미지 타입 (players, teams, leagues, coachs, venues)
 * @param id - API-Sports 이미지 ID
 * @returns API-Sports 직접 URL
 */
export function getApiSportsImageUrl(type: ImageType, id: string | number): string {
  // 경기장은 venues/{id}.png 형태로 시도
  if (type === ImageType.Venues) {
    return `${API_SPORTS_BASE_URL}/venues/${id}.png`;
  }
  return `${API_SPORTS_BASE_URL}/${type}/${id}.png`;
}

/**
 * Supabase Storage URL 생성
 * 
 * @param type - 이미지 타입
 * @param id - 이미지 ID
 * @returns Supabase Storage URL
 */
export function getSupabaseStorageUrl(type: ImageType, id: string | number): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${type}/${id}.png`;
}

/**
 * Supabase Storage에서 캐시된 이미지를 가져오거나 캐시하는 함수
 * 메모리 캐시를 사용하여 중복 요청 방지
 * 
 * @param type - 이미지 타입
 * @param id - 이미지 ID
 * @param options - 옵션 (strict: 외부 URL 폴백 차단)
 * @returns 캐시된 이미지 URL 또는 폴백 URL
 */
export async function getCachedImageUrl(
  type: ImageType, 
  id: string | number, 
  options?: { strict?: boolean }
): Promise<string | null> {
  const cacheKey = `${type}-${id}`;
  const { strict = false } = options || {};
  
  // 메모리 캐시에서 먼저 확인
  if (imageUrlCache.has(cacheKey)) {
    const cached = imageUrlCache.get(cacheKey);
    return cached || null;
  }
  
  try {
    // 동적 임포트로 서버 액션 불러오기 (클라이언트에서 호출 가능)
    const { getCachedImageFromStorage } = await import('@/shared/actions/image-storage-actions');
    const result = await getCachedImageFromStorage(type as 'players' | 'teams' | 'leagues' | 'coachs', id);
    
    if (result.success && result.url && result.url.includes('supabase.co')) {
      // Supabase Storage URL만 캐시하고 반환
      imageUrlCache.set(cacheKey, result.url);
      return result.url;
    }
  } catch (error) {
    console.error('Failed to get cached image:', error);
  }
  
  // Strict 모드: 외부 URL 폴백 금지
  if (strict) {
    return null;
  }
  
  // Non-strict 모드: 외부 URL 폴백 허용
  const fallbackUrl = getApiSportsImageUrl(type, id);
  imageUrlCache.set(cacheKey, fallbackUrl);
  return fallbackUrl;
}

/**
 * 선수 이미지 URL 생성 (Supabase Storage 우선)
 * 
 * @param playerId - 선수 ID
 * @returns 선수 이미지 URL (Promise)
 */
export async function getPlayerImageUrlCached(playerId: string | number): Promise<string | null> {
  return getCachedImageUrl(ImageType.Players, playerId);
}

/**
 * 팀 로고 URL 생성 (Supabase Storage 우선)
 * 
 * @param teamId - 팀 ID
 * @returns 팀 로고 URL (Promise)
 */
export async function getTeamLogoUrlCached(teamId: string | number): Promise<string | null> {
  return getCachedImageUrl(ImageType.Teams, teamId);
}

/**
 * 리그 로고 URL 생성 (Supabase Storage 우선)
 * 
 * @param leagueId - 리그 ID
 * @returns 리그 로고 URL (Promise)
 */
export async function getLeagueLogoUrlCached(leagueId: string | number): Promise<string | null> {
  return getCachedImageUrl(ImageType.Leagues, leagueId);
}

/**
 * 감독 이미지 URL 생성 (Supabase Storage 우선)
 * 
 * @param coachId - 감독 ID
 * @returns 감독 이미지 URL (Promise)
 */
export async function getCoachImageUrlCached(coachId: string | number): Promise<string | null> {
  return getCachedImageUrl(ImageType.Coachs, coachId);
}

/**
 * 선수 이미지 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param playerId - 선수 ID
 * @returns 선수 이미지 URL
 */
export function getPlayerImageUrl(playerId: string | number): string {
  return getApiSportsImageUrl(ImageType.Players, playerId);
}

/**
 * 팀 로고 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param teamId - 팀 ID
 * @returns 팀 로고 URL
 */
export function getTeamLogoUrl(teamId: string | number): string {
  return getApiSportsImageUrl(ImageType.Teams, teamId);
}

/**
 * 리그 로고 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param leagueId - 리그 ID
 * @returns 리그 로고 URL
 */
export function getLeagueLogoUrl(leagueId: string | number): string {
  return getApiSportsImageUrl(ImageType.Leagues, leagueId);
}

/**
 * 감독 이미지 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param coachId - 감독 ID
 * @returns 감독 이미지 URL
 */
export function getCoachImageUrl(coachId: string | number): string {
  return getApiSportsImageUrl(ImageType.Coachs, coachId);
}

/**
 * 이미지 URL이 API-Sports URL인지 확인
 * 
 * @param url - 확인할 URL
 * @returns API-Sports URL 여부
 */
export function isApiSportsUrl(url: string): boolean {
  return Boolean(url && url.includes('media.api-sports.io'));
}

/**
 * 폴백 이미지 URL 생성 (에러 시 사용)
 * 
 * @param type - 이미지 타입
 * @returns 폴백 이미지 경로
 */
export function getFallbackImageUrl(type: ImageType): string {
  const fallbackMap: Record<ImageType, string> = {
    [ImageType.Players]: '/images/player-placeholder.png',
    [ImageType.Teams]: '/images/team-placeholder.png',
    [ImageType.Leagues]: '/images/team-placeholder.png', // 리그도 팀 플레이스홀더 사용
    [ImageType.Coachs]: '/images/player-placeholder.png', // 감독도 선수 플레이스홀더 사용
    [ImageType.Venues]: '/images/team-placeholder.png', // 경기장도 팀 플레이스홀더 사용
  };
  
  return fallbackMap[type] || '/images/player-placeholder.png';
}

/**
 * 이미지 타입 추론을 위한 URL 패턴 (enum 기반)
 * 
 * @param url - API Sports URL
 * @returns 추론된 이미지 타입
 */
export function getImageTypeFromUrl(url: string): ImageType | null {
  if (url.includes('/players/')) return ImageType.Players;
  if (url.includes('/teams/')) return ImageType.Teams;
  if (url.includes('/leagues/')) return ImageType.Leagues;
  if (url.includes('/coachs/')) return ImageType.Coachs;
  return null;
} 

/**
 * API-Sports URL에서 이미지 ID 추출
 */
export function getImageIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(players|teams|leagues|coachs|venues)\/(\d+)\.(png|gif)$/);
  return match ? match[2] : null;
}
/**
 * API-Sports 이미지 URL을 생성하고 Supabase Storage 캐싱을 관리하는 유틸리티 함수들
 */

import { getCachedImageFromStorage } from '@/shared/actions/image-storage-actions'

// 클라이언트 메모리 캐시 (중복 요청 방지)
const imageUrlCache = new Map<string, string>()

// 지원하는 이미지 타입 (enum으로 타입 안정성 강화)
export enum ImageType {
  Players = 'players',
  Teams = 'teams',
  Leagues = 'leagues',
  Coachs = 'coachs',
}

// API-Sports.io 기본 URL
const API_SPORTS_BASE_URL = 'https://media.api-sports.io/football'

/**
 * API-Sports 이미지 URL 생성 (직접 URL)
 * 
 * @param type - 이미지 타입 (players, teams, leagues, coachs)
 * @param id - API-Sports 이미지 ID
 * @returns API-Sports 직접 URL
 */
export function getApiSportsImageUrl(type: ImageType, id: string | number): string {
  return `${API_SPORTS_BASE_URL}/${type}/${id}.png`
}

/**
 * Supabase Storage에서 캐시된 이미지를 가져오거나 캐시하는 함수
 * 메모리 캐시를 사용하여 중복 요청 방지
 * 
 * @param type - 이미지 타입
 * @param id - 이미지 ID
 * @returns 캐시된 이미지 URL 또는 직접 URL
 */
export async function getCachedImageUrl(type: ImageType, id: string | number): Promise<string> {
  const cacheKey = `${type}-${id}`
  
  // 메모리 캐시에서 먼저 확인
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!
  }
  
  try {
    const result = await getCachedImageFromStorage(type as 'players' | 'teams' | 'leagues' | 'coachs', id)
    if (result.success && result.url) {
      // 메모리 캐시에 저장
      imageUrlCache.set(cacheKey, result.url)
      return result.url
    }
  } catch (error) {
    console.error('Failed to get cached image:', error)
  }
  
  // 캐시 실패 시 직접 API-Sports URL 반환 (메모리 캐시에도 저장)
  const fallbackUrl = getApiSportsImageUrl(type, id)
  imageUrlCache.set(cacheKey, fallbackUrl)
  return fallbackUrl
}

/**
 * 선수 이미지 URL 생성 (Supabase Storage 우선)
 * 
 * @param playerId - 선수 ID
 * @returns 선수 이미지 URL (Promise)
 */
export async function getPlayerImageUrlCached(playerId: string | number): Promise<string> {
  return getCachedImageUrl(ImageType.Players, playerId)
}

/**
 * 팀 로고 URL 생성 (Supabase Storage 우선)
 * 
 * @param teamId - 팀 ID
 * @returns 팀 로고 URL (Promise)
 */
export async function getTeamLogoUrlCached(teamId: string | number): Promise<string> {
  return getCachedImageUrl(ImageType.Teams, teamId)
}

/**
 * 리그 로고 URL 생성 (Supabase Storage 우선)
 * 
 * @param leagueId - 리그 ID
 * @returns 리그 로고 URL (Promise)
 */
export async function getLeagueLogoUrlCached(leagueId: string | number): Promise<string> {
  return getCachedImageUrl(ImageType.Leagues, leagueId)
}

/**
 * 감독 이미지 URL 생성 (Supabase Storage 우선)
 * 
 * @param coachId - 감독 ID
 * @returns 감독 이미지 URL (Promise)
 */
export async function getCoachImageUrlCached(coachId: string | number): Promise<string> {
  return getCachedImageUrl(ImageType.Coachs, coachId)
}

/**
 * 선수 이미지 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param playerId - 선수 ID
 * @returns 선수 이미지 URL
 */
export function getPlayerImageUrl(playerId: string | number): string {
  return getApiSportsImageUrl(ImageType.Players, playerId)
}

/**
 * 팀 로고 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param teamId - 팀 ID
 * @returns 팀 로고 URL
 */
export function getTeamLogoUrl(teamId: string | number): string {
  return getApiSportsImageUrl(ImageType.Teams, teamId)
}

/**
 * 리그 로고 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param leagueId - 리그 ID
 * @returns 리그 로고 URL
 */
export function getLeagueLogoUrl(leagueId: string | number): string {
  return getApiSportsImageUrl(ImageType.Leagues, leagueId)
}

/**
 * 감독 이미지 URL 생성 (동기 버전 - 직접 URL)
 * 
 * @param coachId - 감독 ID
 * @returns 감독 이미지 URL
 */
export function getCoachImageUrl(coachId: string | number): string {
  return getApiSportsImageUrl(ImageType.Coachs, coachId)
}

/**
 * 기존 API-Sports URL을 그대로 반환 (호환성 유지)
 * 
 * @param originalUrl - 기존 API-Sports URL
 * @returns 원본 URL
 */
export function convertApiSportsUrl(originalUrl: string): string {
  return originalUrl
}

/**
 * 이미지 URL이 API-Sports URL인지 확인
 * 
 * @param url - 확인할 URL
 * @returns API-Sports URL 여부
 */
export function isApiSportsUrl(url: string): boolean {
  return Boolean(url && url.includes('media.api-sports.io'))
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
  }
  
  return fallbackMap[type] || '/images/player-placeholder.png'
} 
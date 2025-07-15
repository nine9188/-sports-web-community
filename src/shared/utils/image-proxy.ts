/**
 * API-Sports 이미지를 Vercel CDN을 통해 프록시하기 위한 유틸리티 함수들
 */

// 지원하는 이미지 타입 (enum으로 타입 안정성 강화)
export enum ImageType {
  Players = 'players',
  Teams = 'teams',
  Leagues = 'leagues',
  Coachs = 'coachs',
}

// 기본 도메인 (환경에 따라 자동 결정) - Hydration Mismatch 방지
const getBaseUrl = () => {
  // 1. 명시적으로 설정된 사이트 URL 우선 사용 (서버/클라이언트 동일)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // 2. Vercel 환경변수 사용 (프로덕션)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // 3. 상대 경로 사용 (Hydration Mismatch 완전 방지)
  return ''
}

/**
 * API-Sports 이미지 ID를 Vercel CDN 프록시 URL로 변환
 * 
 * @param type - 이미지 타입 (players, teams, leagues, coachs)
 * @param id - API-Sports 이미지 ID
 * @returns Vercel CDN을 통한 프록시 URL
 */
export function getProxiedImageUrl(type: ImageType, id: string | number): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/api/images?type=${type}&id=${id}`
}

/**
 * 선수 이미지 URL 생성
 * 
 * @param playerId - 선수 ID
 * @returns 프록시된 선수 이미지 URL
 */
export function getPlayerImageUrl(playerId: string | number): string {
  return getProxiedImageUrl(ImageType.Players, playerId)
}

/**
 * 팀 로고 URL 생성
 * 
 * @param teamId - 팀 ID
 * @returns 프록시된 팀 로고 URL
 */
export function getTeamLogoUrl(teamId: string | number): string {
  return getProxiedImageUrl(ImageType.Teams, teamId)
}

/**
 * 리그 로고 URL 생성
 * 
 * @param leagueId - 리그 ID
 * @returns 프록시된 리그 로고 URL
 */
export function getLeagueLogoUrl(leagueId: string | number): string {
  return getProxiedImageUrl(ImageType.Leagues, leagueId)
}

/**
 * 감독 이미지 URL 생성
 * 
 * @param coachId - 감독 ID
 * @returns 프록시된 감독 이미지 URL
 */
export function getCoachImageUrl(coachId: string | number): string {
  return getProxiedImageUrl(ImageType.Coachs, coachId)
}

/**
 * 기존 API-Sports URL을 프록시 URL로 변환
 * 
 * @param originalUrl - 기존 API-Sports URL
 * @returns 프록시 URL 또는 원본 URL (변환할 수 없는 경우)
 */
export function convertApiSportsUrl(originalUrl: string): string {
  if (!originalUrl || !originalUrl.includes('media.api-sports.io')) {
    return originalUrl
  }
  
  // URL에서 타입과 ID 추출
  const urlPattern = /https:\/\/media\.api-sports\.io\/football\/(players|teams|leagues|coachs)\/(\d+)\.png/
  const match = originalUrl.match(urlPattern)
  
  if (match) {
    const [, type, id] = match
    return getProxiedImageUrl(type as ImageType, id)
  }
  
  // 변환할 수 없는 경우 원본 URL 반환
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
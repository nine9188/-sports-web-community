'use client';

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

/**
 * 선수 ID로 한국어 이름을 찾는 함수
 * @param playerId 선수 ID
 * @param teamPlayers 팀 선수 데이터
 * @returns 한국어 이름 또는 null
 */
export function getPlayerKoreanName(
  playerId: number, 
  teamPlayers: Record<string, PremierLeaguePlayer[]>
): string | null {
  if (!playerId) return null;

  // ID 기반으로 선수 찾기 및 한국어 이름 반환 로직
  const findPlayerById = (players: PremierLeaguePlayer[]) => {
    return players.find(player => 'id' in player && player.id === playerId);
  };

  // 모든 팀에서 선수 찾기
  let player: PremierLeaguePlayer | undefined;
  
  for (const team in teamPlayers) {
    player = findPlayerById(teamPlayers[team]);
    if (player) break;
  }

  if (!player) return null;

  // 다양한 형태의 한국어 이름 속성 반환
  if ('koreanName' in player && player.koreanName) return player.koreanName;
  if ('korean_name' in player && player.korean_name) return player.korean_name;
  
  // 추가 속성 체크 (영어 이름과 함께 있는 경우)
  if ('english_name' in player && 'korean_name' in player) return player.korean_name;
  if ('englishName' in player && 'koreanName' in player) return player.koreanName;
  
  return null;
}

/**
 * 팀 한국어 이름 또는 기본 이름을 가져오는 함수
 * @param team 팀 데이터
 * @param fallbackName 기본 이름
 * @returns 표시할 팀 이름
 */
export function getTeamDisplayName(
  team: { id: number; name: string; name_ko?: string; } | null, 
  fallbackName: string = '팀'
): string {
  if (!team) return fallbackName;
  return team.name_ko || team.name || fallbackName;
}

/**
 * 팀 로고 URL을 가져오는 함수
 * @param team 팀 데이터
 * @returns 팀 로고 URL
 */
export function getTeamLogoUrl(
  team: { id: number; logo?: string; } | null
): string {
  if (!team || !team.logo) return '';
  return team.logo;
} 
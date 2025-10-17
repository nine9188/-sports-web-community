'use client';

import { getPlayerKoreanName as getPlayerKoreanNameFromConstants } from '@/domains/livescore/constants/players';

/**
 * 선수 ID로 한국어 이름을 찾는 함수
 * 통합 선수 데이터베이스를 사용합니다.
 * @param playerId 선수 ID
 * @returns 한국어 이름 또는 null
 */
export function getPlayerKoreanName(playerId: number): string | null {
  return getPlayerKoreanNameFromConstants(playerId);
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
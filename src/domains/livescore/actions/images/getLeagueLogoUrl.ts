'use server';

import { leagueLogoUrl, SPORTS_PLACEHOLDERS } from '@/shared/images/urls';
import type { ImageSize } from './constants';

/**
 * 리그 로고 URL 조회 (단일)
 * 정적 파일 있으면 /leagues/{id}.webp, 없으면 CDN 경유
 */
export async function getLeagueLogoUrl(leagueId: number, isDark: boolean = false, size: ImageSize = 'md'): Promise<string> {
  if (!leagueId || leagueId <= 0) {
    return SPORTS_PLACEHOLDERS.leagues;
  }

  return leagueLogoUrl(leagueId, { size, dark: isDark });
}

/**
 * 리그 로고 Storage URL 배치 조회
 *
 * @param leagueIds - 리그 ID 배열
 * @param isDark - 다크모드 여부
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns { [leagueId]: storageUrl } 맵
 */
export async function getLeagueLogoUrls(
  leagueIds: number[],
  isDark: boolean = false,
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!leagueIds || leagueIds.length === 0) {
    return {};
  }

  const result: Record<number, string> = {};

  for (const id of leagueIds) {
    if (!id || id <= 0) continue;
    result[id] = leagueLogoUrl(id, { size, dark: isDark });
  }

  return result;
}

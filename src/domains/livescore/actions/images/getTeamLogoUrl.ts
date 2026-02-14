'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, type ImageSize } from './constants';

/**
 * 팀 로고 Storage URL 조회 (단일)
 *
 * 4590 표준: 모든 이미지는 Supabase Storage에서 제공
 *
 * @param teamId - 팀 ID
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const logoUrl = await getTeamLogoUrl(33); // 맨유 (기본 md)
 * const lgLogoUrl = await getTeamLogoUrl(33, 'lg'); // 헤더용 lg
 */
export async function getTeamLogoUrl(teamId: number, size: ImageSize = 'md'): Promise<string> {
  if (!teamId || teamId <= 0) {
    return PLACEHOLDER_URLS.team_logo;
  }

  return ensureAssetCached('team_logo', teamId, size);
}

/**
 * 팀 로고 Storage URL 배치 조회
 *
 * @param teamIds - 팀 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns { [teamId]: storageUrl } 맵
 */
export async function getTeamLogoUrls(
  teamIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!teamIds || teamIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('team_logo', teamIds, size);
}

'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS } from './constants';

/**
 * 팀 로고 Storage URL 조회 (단일)
 *
 * 4590 표준: 모든 이미지는 Supabase Storage에서 제공
 *
 * @param teamId - 팀 ID
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const logoUrl = await getTeamLogoUrl(33); // 맨유
 * // => "https://xxx.supabase.co/storage/v1/object/public/teams/33.png"
 */
export async function getTeamLogoUrl(teamId: number): Promise<string> {
  if (!teamId || teamId <= 0) {
    return PLACEHOLDER_URLS.team_logo;
  }

  return ensureAssetCached('team_logo', teamId);
}

/**
 * 팀 로고 Storage URL 배치 조회
 *
 * 성능 최적화:
 * - 한 번의 DB 조회로 모든 캐시 확인
 * - 없는 것들만 병렬로 캐싱 시도
 *
 * @param teamIds - 팀 ID 배열
 * @returns { [teamId]: storageUrl } 맵
 *
 * @example
 * const logos = await getTeamLogoUrls([33, 34, 40]);
 * // => { 33: "https://...", 34: "https://...", 40: "https://..." }
 */
export async function getTeamLogoUrls(
  teamIds: number[]
): Promise<Record<number, string>> {
  if (!teamIds || teamIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('team_logo', teamIds);
}

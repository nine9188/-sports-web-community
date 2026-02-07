'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS } from './constants';

/**
 * 선수 사진 Storage URL 조회 (단일)
 *
 * @param playerId - 선수 ID
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getPlayerPhotoUrl(306); // 손흥민
 * // => "https://xxx.supabase.co/storage/v1/object/public/players/306.png"
 */
export async function getPlayerPhotoUrl(playerId: number): Promise<string> {
  if (!playerId || playerId <= 0) {
    return PLACEHOLDER_URLS.player_photo;
  }

  return ensureAssetCached('player_photo', playerId);
}

/**
 * 선수 사진 Storage URL 배치 조회
 *
 * 성능 최적화:
 * - 한 번의 DB 조회로 모든 캐시 확인
 * - 없는 것들만 병렬로 캐싱 시도
 *
 * @param playerIds - 선수 ID 배열
 * @returns { [playerId]: storageUrl } 맵
 *
 * @example
 * const photos = await getPlayerPhotoUrls([306, 1485, 874]);
 * // => { 306: "https://...", 1485: "https://...", 874: "https://..." }
 */
export async function getPlayerPhotoUrls(
  playerIds: number[]
): Promise<Record<number, string>> {
  if (!playerIds || playerIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('player_photo', playerIds);
}

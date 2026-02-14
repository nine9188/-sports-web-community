'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, type ImageSize } from './constants';

/**
 * 선수 사진 Storage URL 조회 (단일)
 *
 * @param playerId - 선수 ID
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getPlayerPhotoUrl(306); // 손흥민 (기본 md)
 * const lgPhotoUrl = await getPlayerPhotoUrl(306, 'lg'); // 헤더용 lg
 */
export async function getPlayerPhotoUrl(playerId: number, size: ImageSize = 'md'): Promise<string> {
  if (!playerId || playerId <= 0) {
    return PLACEHOLDER_URLS.player_photo;
  }

  return ensureAssetCached('player_photo', playerId, size);
}

/**
 * 선수 사진 Storage URL 배치 조회
 *
 * @param playerIds - 선수 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns { [playerId]: storageUrl } 맵
 */
export async function getPlayerPhotoUrls(
  playerIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!playerIds || playerIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('player_photo', playerIds, size);
}

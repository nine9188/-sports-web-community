'use server';

import { playerPhotoUrl, SPORTS_PLACEHOLDERS } from '@/shared/images/urls';
import type { ImageSize } from './constants';

/**
 * 선수 사진 Storage URL 조회 (단일)
 *
 * @param playerId - 선수 ID
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getPlayerPhotoUrl(306); // 손흥민 (기본 md)
 */
export async function getPlayerPhotoUrl(playerId: number, size: ImageSize = 'md'): Promise<string> {
  if (!playerId || playerId <= 0) {
    return SPORTS_PLACEHOLDERS.players;
  }

  return playerPhotoUrl(playerId, size);
}

/**
 * 선수 사진 Storage URL 배치 조회
 *
 * @param playerIds - 선수 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns { [playerId]: storageUrl } 맵
 */
export async function getPlayerPhotoUrls(
  playerIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!playerIds || playerIds.length === 0) {
    return {};
  }

  return Object.fromEntries(
    playerIds
      .filter((id) => id && id > 0)
      .map((id) => [id, playerPhotoUrl(id, size)])
  );
}

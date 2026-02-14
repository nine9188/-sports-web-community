'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, type ImageSize } from './constants';

/**
 * 감독 사진 Storage URL 조회 (단일)
 *
 * @param coachId - 감독 ID
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getCoachPhotoUrl(123); // 기본 md
 * const lgPhotoUrl = await getCoachPhotoUrl(123, 'lg'); // 헤더용 lg
 */
export async function getCoachPhotoUrl(coachId: number, size: ImageSize = 'md'): Promise<string> {
  if (!coachId || coachId <= 0) {
    return PLACEHOLDER_URLS.coach_photo;
  }

  return ensureAssetCached('coach_photo', coachId, size);
}

/**
 * 감독 사진 Storage URL 배치 조회
 *
 * @param coachIds - 감독 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns { [coachId]: storageUrl } 맵
 */
export async function getCoachPhotoUrls(
  coachIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!coachIds || coachIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('coach_photo', coachIds, size);
}

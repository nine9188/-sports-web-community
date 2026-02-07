'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS } from './constants';

/**
 * 감독 사진 Storage URL 조회 (단일)
 *
 * @param coachId - 감독 ID
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getCoachPhotoUrl(123);
 * // => "https://xxx.supabase.co/storage/v1/object/public/coachs/123.png"
 */
export async function getCoachPhotoUrl(coachId: number): Promise<string> {
  if (!coachId || coachId <= 0) {
    return PLACEHOLDER_URLS.coach_photo;
  }

  return ensureAssetCached('coach_photo', coachId);
}

/**
 * 감독 사진 Storage URL 배치 조회
 *
 * @param coachIds - 감독 ID 배열
 * @returns { [coachId]: storageUrl } 맵
 *
 * @example
 * const photos = await getCoachPhotoUrls([123, 456]);
 * // => { 123: "https://...", 456: "https://..." }
 */
export async function getCoachPhotoUrls(
  coachIds: number[]
): Promise<Record<number, string>> {
  if (!coachIds || coachIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('coach_photo', coachIds);
}

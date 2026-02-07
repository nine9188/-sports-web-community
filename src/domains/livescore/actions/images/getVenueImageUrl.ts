'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS } from './constants';

/**
 * 경기장(venue) 이미지 Storage URL 조회 (단일)
 *
 * 4590 표준: 모든 이미지는 Supabase Storage에서 제공
 *
 * @param venueId - 경기장 ID
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const venueUrl = await getVenueImageUrl(556); // 올드 트래포드
 * // => "https://xxx.supabase.co/storage/v1/object/public/venues/556.png"
 */
export async function getVenueImageUrl(venueId: number): Promise<string> {
  if (!venueId || venueId <= 0) {
    return PLACEHOLDER_URLS.venue_photo;
  }

  return ensureAssetCached('venue_photo', venueId);
}

/**
 * 경기장 이미지 Storage URL 배치 조회
 *
 * 성능 최적화:
 * - 한 번의 DB 조회로 모든 캐시 확인
 * - 없는 것들만 병렬로 캐싱 시도
 *
 * @param venueIds - 경기장 ID 배열
 * @returns { [venueId]: storageUrl } 맵
 *
 * @example
 * const venues = await getVenueImageUrls([556, 494, 504]);
 * // => { 556: "https://...", 494: "https://...", 504: "https://..." }
 */
export async function getVenueImageUrls(
  venueIds: number[]
): Promise<Record<number, string>> {
  if (!venueIds || venueIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('venue_photo', venueIds);
}

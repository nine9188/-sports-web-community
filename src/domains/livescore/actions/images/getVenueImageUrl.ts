'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, type ImageSize } from './constants';

/**
 * 경기장(venue) 이미지 Storage URL 조회 (단일)
 *
 * 4590 표준: 모든 이미지는 Supabase Storage에서 제공
 *
 * @param venueId - 경기장 ID
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const venueUrl = await getVenueImageUrl(556); // 올드 트래포드 (기본 md)
 * const lgVenueUrl = await getVenueImageUrl(556, 'lg'); // 헤더용 lg
 */
export async function getVenueImageUrl(venueId: number, size: ImageSize = 'md'): Promise<string> {
  if (!venueId || venueId <= 0) {
    return PLACEHOLDER_URLS.venue_photo;
  }

  return ensureAssetCached('venue_photo', venueId, size);
}

/**
 * 경기장 이미지 Storage URL 배치 조회
 *
 * @param venueIds - 경기장 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns { [venueId]: storageUrl } 맵
 */
export async function getVenueImageUrls(
  venueIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!venueIds || venueIds.length === 0) {
    return {};
  }

  return ensureAssetsCached('venue_photo', venueIds, size);
}

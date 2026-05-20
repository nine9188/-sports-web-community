'use server';

import { coachPhotoUrl, SPORTS_PLACEHOLDERS } from '@/shared/images/urls';
import type { ImageSize } from './constants';

/**
 * 감독 사진 Storage URL 조회 (단일)
 *
 * @param coachId - 감독 ID
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const photoUrl = await getCoachPhotoUrl(123); // 기본 md
 */
export async function getCoachPhotoUrl(coachId: number, size: ImageSize = 'md'): Promise<string> {
  if (!coachId || coachId <= 0) {
    return SPORTS_PLACEHOLDERS.coachs;
  }

  return coachPhotoUrl(coachId, size);
}

/**
 * 감독 사진 Storage URL 배치 조회
 *
 * @param coachIds - 감독 ID 배열
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns { [coachId]: storageUrl } 맵
 */
export async function getCoachPhotoUrls(
  coachIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!coachIds || coachIds.length === 0) {
    return {};
  }

  return Object.fromEntries(
    coachIds
      .filter((id) => id && id > 0)
      .map((id) => [id, coachPhotoUrl(id, size)])
  );
}

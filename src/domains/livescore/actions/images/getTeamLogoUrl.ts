'use server';

import { SPORTS_PLACEHOLDERS, teamLogoUrl } from '@/shared/images/urls';
import type { ImageSize } from './constants';

/**
 * 팀 로고 URL 조회 (단일)
 * 정적 파일 있으면 /teams/{id}.webp, 없으면 CDN 경유
 */
export async function getTeamLogoUrl(teamId: number, size: ImageSize = 'md'): Promise<string> {
  if (!teamId || teamId <= 0) {
    return SPORTS_PLACEHOLDERS.teams;
  }

  return teamLogoUrl(teamId, size);
}

/**
 * 팀 로고 URL 배치 조회
 * 정적 파일 있는 팀은 즉시 반환, 없는 팀만 CDN 경유
 */
export async function getTeamLogoUrls(
  teamIds: number[],
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!teamIds || teamIds.length === 0) {
    return {};
  }

  const result: Record<number, string> = {};

  for (const id of teamIds) {
    if (!id || id <= 0) continue;
    result[id] = teamLogoUrl(id, size);
  }

  return result;
}

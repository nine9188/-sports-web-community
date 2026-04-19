'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, type ImageSize } from './constants';

const STATIC_TEAM_IDS = new Set([
  33,34,35,36,39,40,42,44,45,47,48,49,50,51,52,55,63,65,66,77,79,80,81,82,83,84,85,91,93,94,95,96,97,
  106,108,111,112,114,116,157,160,161,162,163,164,165,167,168,169,170,172,173,175,176,180,182,186,191,192,
  487,488,489,490,492,494,495,496,497,499,500,502,503,504,505,511,517,520,523,529,530,531,532,533,534,
  536,537,538,539,540,541,542,543,546,547,548,718,720,727,728,746,797,798,801,867,895,
  1063,1579,2745,2746,2747,2748,2749,2750,2751,2752,2753,2756,2757,2758,2759,2760,2761,2762,2763,2764,
  2765,2766,2767,2768,7060,7061,7076,7078,7087,7098,9171,
]);

function getStaticTeamLogo(teamId: number): string {
  return `/teams/${teamId}.webp`;
}

/**
 * 팀 로고 URL 조회 (단일)
 * 정적 파일 있으면 /teams/{id}.webp, 없으면 CDN 경유
 */
export async function getTeamLogoUrl(teamId: number, size: ImageSize = 'md'): Promise<string> {
  if (!teamId || teamId <= 0) {
    return PLACEHOLDER_URLS.team_logo;
  }

  if (STATIC_TEAM_IDS.has(teamId)) {
    return getStaticTeamLogo(teamId);
  }

  return ensureAssetCached('team_logo', teamId, size);
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
  const cdnIds: number[] = [];

  for (const id of teamIds) {
    if (!id || id <= 0) continue;
    if (STATIC_TEAM_IDS.has(id)) {
      result[id] = getStaticTeamLogo(id);
    } else {
      cdnIds.push(id);
    }
  }

  if (cdnIds.length > 0) {
    const cdnResults = await ensureAssetsCached('team_logo', cdnIds, size);
    Object.assign(result, cdnResults);
  }

  return result;
}

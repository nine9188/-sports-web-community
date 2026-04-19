'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, SUPABASE_STORAGE_URL, EXTENSION_MAP, type ImageSize } from './constants';

// 다크모드 전용 로고가 있는 리그 ID 목록 (Storage에 실제 파일이 있는 리그만)
const DARK_MODE_LEAGUE_IDS = [2, 3, 13, 39, 61, 66, 88, 98, 119, 179, 292, 848];

// 로컬 정적 파일이 있는 주요 리그 ID (public/leagues/{id}.webp)
const STATIC_LEAGUE_IDS = new Set([
  2, 3, 39, 61, 78, 88, 94, 98, 135, 140, 179, 292, 293, 848,
]);

// 다크모드 로컬 파일이 있는 리그 ID (public/leagues/{id}-1.webp)
const STATIC_DARK_LEAGUE_IDS = new Set([
  2, 3, 39, 61, 88, 98, 179, 292, 848,
]);

function getStaticLeagueLogo(leagueId: number, isDark: boolean): string {
  if (isDark && STATIC_DARK_LEAGUE_IDS.has(leagueId)) {
    return `/leagues/${leagueId}-1.webp`;
  }
  return `/leagues/${leagueId}.webp`;
}

/**
 * 리그 로고 URL 조회 (단일)
 * 정적 파일 있으면 /leagues/{id}.webp, 없으면 CDN 경유
 */
export async function getLeagueLogoUrl(leagueId: number, isDark: boolean = false, size: ImageSize = 'md'): Promise<string> {
  if (!leagueId || leagueId <= 0) {
    return PLACEHOLDER_URLS.league_logo;
  }

  if (STATIC_LEAGUE_IDS.has(leagueId)) {
    return getStaticLeagueLogo(leagueId, isDark);
  }

  // 다크모드이고 다크모드 로고가 있는 리그인 경우
  if (isDark && DARK_MODE_LEAGUE_IDS.includes(leagueId)) {
    const ext = EXTENSION_MAP.league_logo;
    return `${SUPABASE_STORAGE_URL}/leagues/${size}/${leagueId}-1.${ext}`;
  }

  return ensureAssetCached('league_logo', leagueId, size);
}

/**
 * 리그 로고 Storage URL 배치 조회
 *
 * @param leagueIds - 리그 ID 배열
 * @param isDark - 다크모드 여부
 * @param size - 이미지 사이즈 ('sm' | 'md')
 * @returns { [leagueId]: storageUrl } 맵
 */
export async function getLeagueLogoUrls(
  leagueIds: number[],
  isDark: boolean = false,
  size: ImageSize = 'md'
): Promise<Record<number, string>> {
  if (!leagueIds || leagueIds.length === 0) {
    return {};
  }

  const result: Record<number, string> = {};
  const remoteIds: number[] = [];

  // 로컬 정적 파일이 있는 리그는 즉시 처리
  for (const id of leagueIds) {
    if (STATIC_LEAGUE_IDS.has(id)) {
      result[id] = getStaticLeagueLogo(id, isDark);
    } else {
      remoteIds.push(id);
    }
  }

  if (remoteIds.length === 0) {
    return result;
  }

  // 나머지는 CDN/캐싱 시스템 사용
  if (isDark) {
    const ext = EXTENSION_MAP.league_logo;
    const darkModeLeagues: number[] = [];
    const normalLeagues: number[] = [];

    for (const id of remoteIds) {
      if (DARK_MODE_LEAGUE_IDS.includes(id)) {
        darkModeLeagues.push(id);
      } else {
        normalLeagues.push(id);
      }
    }

    for (const id of darkModeLeagues) {
      result[id] = `${SUPABASE_STORAGE_URL}/leagues/${size}/${id}-1.${ext}`;
    }

    if (normalLeagues.length > 0) {
      const normalUrls = await ensureAssetsCached('league_logo', normalLeagues, size);
      Object.assign(result, normalUrls);
    }
  } else {
    const remoteUrls = await ensureAssetsCached('league_logo', remoteIds, size);
    Object.assign(result, remoteUrls);
  }

  return result;
}

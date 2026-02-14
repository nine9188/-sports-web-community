'use server';

import { ensureAssetCached, ensureAssetsCached } from './ensureAssetCached';
import { PLACEHOLDER_URLS, SUPABASE_STORAGE_URL, EXTENSION_MAP, type ImageSize } from './constants';

// 다크모드 전용 로고가 있는 리그 ID 목록 (Storage에 실제 파일이 있는 리그만)
const DARK_MODE_LEAGUE_IDS = [2, 3, 13, 39, 61, 66, 88, 98, 119, 179, 292, 848];

/**
 * 리그 로고 Storage URL 조회 (단일)
 *
 * 4590 표준: 모든 이미지는 Supabase Storage에서 제공
 *
 * @param leagueId - 리그 ID
 * @param isDark - 다크모드 여부
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
 * @returns Storage 공개 URL 또는 placeholder
 *
 * @example
 * const logoUrl = await getLeagueLogoUrl(39); // 프리미어리그 (md)
 * const darkLogoUrl = await getLeagueLogoUrl(39, true); // 다크모드 (md)
 * const lgLogoUrl = await getLeagueLogoUrl(39, false, 'lg'); // 헤더용 lg
 */
export async function getLeagueLogoUrl(leagueId: number, isDark: boolean = false, size: ImageSize = 'md'): Promise<string> {
  if (!leagueId || leagueId <= 0) {
    return PLACEHOLDER_URLS.league_logo;
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
 * @param size - 이미지 사이즈 ('sm' | 'md' | 'lg')
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

  // 다크모드 처리가 필요한 경우 개별 조회
  if (isDark) {
    const result: Record<number, string> = {};
    const ext = EXTENSION_MAP.league_logo;

    // 다크모드 로고가 있는 리그와 없는 리그 분리
    const darkModeLeagues: number[] = [];
    const normalLeagues: number[] = [];

    for (const id of leagueIds) {
      if (DARK_MODE_LEAGUE_IDS.includes(id)) {
        darkModeLeagues.push(id);
      } else {
        normalLeagues.push(id);
      }
    }

    // 다크모드 로고가 있는 리그는 직접 URL 생성
    for (const id of darkModeLeagues) {
      result[id] = `${SUPABASE_STORAGE_URL}/leagues/${size}/${id}-1.${ext}`;
    }

    // 나머지는 일반 캐싱 시스템 사용
    if (normalLeagues.length > 0) {
      const normalUrls = await ensureAssetsCached('league_logo', normalLeagues, size);
      Object.assign(result, normalUrls);
    }

    return result;
  }

  return ensureAssetsCached('league_logo', leagueIds, size);
}

'use server';

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getSupabaseAction } from '@/shared/lib/supabase/client.server';

// 국가대표 친선경기 리그 ID
const INTERNATIONAL_FRIENDLIES_LEAGUE_ID = 10;

/**
 * 국가대표 친선경기에 등록된 팀(국가) 목록 조회
 */
export async function fetchFriendlyTeams(season?: number): Promise<{
  success: boolean;
  teams: Array<{
    id: number;
    name: string;
    logo: string;
    country: string;
  }>;
  error: string | null;
  rawResponse?: any;
}> {
  try {
    const targetSeason = season || new Date().getFullYear();

    const response = await fetchFromFootballApi('teams', {
      league: INTERNATIONAL_FRIENDLIES_LEAGUE_ID,
      season: targetSeason,
    });

    if (!response?.response) {
      return { success: false, teams: [], error: '데이터가 없습니다.' };
    }

    const teams = response.response.map((item: any) => ({
      id: item.team?.id || 0,
      name: item.team?.name || '',
      logo: item.team?.logo || '',
      country: item.team?.country || '',
    }));

    // 이름순 정렬
    teams.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return {
      success: true,
      teams,
      error: null,
      rawResponse: response,
    };
  } catch (error) {
    return {
      success: false,
      teams: [],
      error: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

interface FriendlyMatch {
  id: number;
  date: string;
  status: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  league: string;
  round: string;
}

/**
 * 국가대표 친선경기 목록 조회
 */
export async function fetchFriendlyMatches(
  type: 'upcoming' | 'recent' = 'upcoming'
): Promise<{
  success: boolean;
  matches: FriendlyMatch[];
  error: string | null;
}> {
  try {
    // 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    let fromDate: string;
    let toDate: string;

    if (type === 'upcoming') {
      // 오늘부터 60일 후까지
      fromDate = kstNow.toISOString().split('T')[0];
      const futureDate = new Date(kstNow.getTime() + 60 * 24 * 60 * 60 * 1000);
      toDate = futureDate.toISOString().split('T')[0];
    } else {
      // 30일 전부터 오늘까지
      const pastDate = new Date(kstNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      fromDate = pastDate.toISOString().split('T')[0];
      toDate = kstNow.toISOString().split('T')[0];
    }

    // 현재 시즌 (보통 연도)
    const season = kstNow.getFullYear();

    const response = await fetchFromFootballApi('fixtures', {
      league: INTERNATIONAL_FRIENDLIES_LEAGUE_ID,
      season: season,
      from: fromDate,
      to: toDate,
    });

    if (!response?.response) {
      return { success: false, matches: [], error: '데이터가 없습니다.' };
    }

    const matches: FriendlyMatch[] = response.response.map((match: any) => ({
      id: match.fixture?.id || 0,
      date: match.fixture?.date || '',
      status: match.fixture?.status?.short || '',
      homeTeam: match.teams?.home?.name || '',
      homeLogo: match.teams?.home?.logo || '',
      awayTeam: match.teams?.away?.name || '',
      awayLogo: match.teams?.away?.logo || '',
      homeScore: match.goals?.home,
      awayScore: match.goals?.away,
      league: match.league?.name || '',
      round: match.league?.round || '',
    }));

    // 정렬: 예정 경기는 오름차순, 최근 경기는 내림차순
    matches.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return type === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    return { success: true, matches, error: null };
  } catch (error) {
    return {
      success: false,
      matches: [],
      error: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

/**
 * 모든 시즌의 국가대표팀 목록 조회 (중복 제거)
 * teams API + fixtures API 둘 다에서 팀 추출
 */
export async function fetchAllFriendlyTeams(): Promise<{
  success: boolean;
  teams: Array<{
    id: number;
    name: string;
    logo: string;
    country: string;
  }>;
  error: string | null;
  totalFromApi: number;
  seasonsChecked: number[];
  fromTeamsApi: number;
  fromFixturesApi: number;
}> {
  try {
    const seasons = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
    const allTeamsMap = new Map<number, { id: number; name: string; logo: string; country: string }>();
    let totalFromApi = 0;
    let fromTeamsApi = 0;
    let fromFixturesApi = 0;

    // 1. 모든 시즌에서 teams API로 팀 가져오기
    for (const season of seasons) {
      const response = await fetchFromFootballApi('teams', {
        league: INTERNATIONAL_FRIENDLIES_LEAGUE_ID,
        season: season,
      });

      if (response?.response) {
        totalFromApi += response.response.length;

        for (const item of response.response) {
          const teamId = item.team?.id;
          if (teamId && !allTeamsMap.has(teamId)) {
            allTeamsMap.set(teamId, {
              id: teamId,
              name: item.team?.name || '',
              logo: item.team?.logo || '',
              country: item.team?.country || '',
            });
            fromTeamsApi++;
          }
        }
      }
    }

    // 2. fixtures API에서 실제 경기하는 팀도 추출 (최근 + 예정 경기)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    // 과거 180일 ~ 미래 90일 범위
    const pastDate = new Date(kstNow.getTime() - 180 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(kstNow.getTime() + 90 * 24 * 60 * 60 * 1000);
    const fromDate = pastDate.toISOString().split('T')[0];
    const toDate = futureDate.toISOString().split('T')[0];

    for (const season of [2026, 2025, 2024]) {
      const fixturesResponse = await fetchFromFootballApi('fixtures', {
        league: INTERNATIONAL_FRIENDLIES_LEAGUE_ID,
        season: season,
        from: fromDate,
        to: toDate,
      });

      if (fixturesResponse?.response) {
        for (const match of fixturesResponse.response) {
          // 홈팀 추출
          const homeTeam = match.teams?.home;
          if (homeTeam?.id && !allTeamsMap.has(homeTeam.id)) {
            allTeamsMap.set(homeTeam.id, {
              id: homeTeam.id,
              name: homeTeam.name || '',
              logo: homeTeam.logo || '',
              country: '', // fixtures에서는 country 정보 없음
            });
            fromFixturesApi++;
            totalFromApi++;
          }

          // 원정팀 추출
          const awayTeam = match.teams?.away;
          if (awayTeam?.id && !allTeamsMap.has(awayTeam.id)) {
            allTeamsMap.set(awayTeam.id, {
              id: awayTeam.id,
              name: awayTeam.name || '',
              logo: awayTeam.logo || '',
              country: '', // fixtures에서는 country 정보 없음
            });
            fromFixturesApi++;
            totalFromApi++;
          }
        }
      }
    }

    // Map을 배열로 변환하고 이름순 정렬
    const teams = Array.from(allTeamsMap.values());
    teams.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`팀 목록 조회 완료: teams API ${fromTeamsApi}개, fixtures API ${fromFixturesApi}개, 총 ${teams.length}개 (중복제거)`);

    return {
      success: true,
      teams,
      error: null,
      totalFromApi,
      seasonsChecked: seasons,
      fromTeamsApi,
      fromFixturesApi,
    };
  } catch (error) {
    return {
      success: false,
      teams: [],
      error: error instanceof Error ? error.message : '오류가 발생했습니다.',
      totalFromApi: 0,
      seasonsChecked: [],
      fromTeamsApi: 0,
      fromFixturesApi: 0,
    };
  }
}

/**
 * 팀 로고를 Supabase Storage에 업로드
 */
export async function uploadTeamLogosToStorage(
  teams: Array<{ id: number; name: string; logo: string; country: string }>
): Promise<{
  success: boolean;
  uploaded: number;
  skipped: number;
  failed: number;
  errors: string[];
  details: Array<{ id: number; name: string; status: 'uploaded' | 'skipped' | 'failed'; error?: string }>;
}> {
  const supabase = await getSupabaseAction();
  const results: Array<{ id: number; name: string; status: 'uploaded' | 'skipped' | 'failed'; error?: string }> = [];
  const errors: string[] = [];
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const team of teams) {
    try {
      // 이미 존재하는지 확인
      const { data: existingFile } = await supabase.storage
        .from('teams')
        .list('', { search: `${team.id}.png` });

      if (existingFile && existingFile.length > 0) {
        skipped++;
        results.push({ id: team.id, name: team.name, status: 'skipped' });
        continue;
      }

      // API-Sports에서 이미지 다운로드
      const response = await fetch(team.logo);
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('teams')
        .upload(`${team.id}.png`, uint8Array, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploaded++;
      results.push({ id: team.id, name: team.name, status: 'uploaded' });
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${team.id} (${team.name}): ${errorMsg}`);
      results.push({ id: team.id, name: team.name, status: 'failed', error: errorMsg });
    }
  }

  return {
    success: failed === 0,
    uploaded,
    skipped,
    failed,
    errors,
    details: results,
  };
}

/**
 * 특정 국가 대표팀 경기 조회
 */
export async function fetchTeamFriendlyMatches(
  teamId: number
): Promise<{
  success: boolean;
  matches: FriendlyMatch[];
  error: string | null;
}> {
  try {
    const now = new Date();
    const season = now.getFullYear();

    const response = await fetchFromFootballApi('fixtures', {
      team: teamId,
      league: INTERNATIONAL_FRIENDLIES_LEAGUE_ID,
      season: season,
    });

    if (!response?.response) {
      return { success: false, matches: [], error: '데이터가 없습니다.' };
    }

    const matches: FriendlyMatch[] = response.response.map((match: any) => ({
      id: match.fixture?.id || 0,
      date: match.fixture?.date || '',
      status: match.fixture?.status?.short || '',
      homeTeam: match.teams?.home?.name || '',
      homeLogo: match.teams?.home?.logo || '',
      awayTeam: match.teams?.away?.name || '',
      awayLogo: match.teams?.away?.logo || '',
      homeScore: match.goals?.home,
      awayScore: match.goals?.away,
      league: match.league?.name || '',
      round: match.league?.round || '',
    }));

    // 날짜순 정렬
    matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { success: true, matches, error: null };
  } catch (error) {
    return {
      success: false,
      matches: [],
      error: error instanceof Error ? error.message : '오류가 발생했습니다.',
    };
  }
}

'use server';

import { getIndexableLeagueIds } from '@/domains/livescore/actions/teamLeagueData';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

const NOINDEX_MATCH_STATUS_CODES = ['CANC', 'Canc', 'PST', 'SUSP', 'ABD', 'AWD', 'WO'];

export type FootballNoindexReason =
  | 'query-state'
  | 'unknown-league'
  | 'non-indexable-league'
  | 'match-status'
  | null;

export async function resolveFootballIndexability({
  leagueId,
  hasQueryState = false,
  matchStatusCode,
  homeTeamName,
  awayTeamName,
}: {
  leagueId?: number | string | null;
  hasQueryState?: boolean;
  matchStatusCode?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
}): Promise<{ shouldNoindex: boolean; reason: FootballNoindexReason }> {
  if (hasQueryState) {
    return { shouldNoindex: true, reason: 'query-state' };
  }

  if (matchStatusCode && NOINDEX_MATCH_STATUS_CODES.includes(matchStatusCode)) {
    return { shouldNoindex: true, reason: 'match-status' };
  }

  const numericLeagueId = typeof leagueId === 'string' ? Number(leagueId) : leagueId;
  if (!numericLeagueId || !Number.isFinite(numericLeagueId)) {
    return { shouldNoindex: true, reason: 'unknown-league' };
  }

  // 1. 만약 국가대표 친선경기(ID: 10)인 경우 청소년/여자 등의 마이너 경기는 제외 (올림픽/아시안게임은 허용)
  if (numericLeagueId === 10) {
    const isYouthOrMinor = (name?: string | null) => {
      if (!name) return false;
      return /\b(?:U\d{2}|U-\d{2}|Under \d{2}|Women|W-Team|여자|U23|U21|U20|U19|U18|U17)\b/i.test(name) ||
        name.includes(' U2') || name.includes(' U1') || name.includes(' 여자');
    };
    if (isYouthOrMinor(homeTeamName) || isYouthOrMinor(awayTeamName)) {
      return { shouldNoindex: true, reason: 'non-indexable-league' };
    }
  }

  const indexableLeagueIds = await getIndexableLeagueIds();
  if (!indexableLeagueIds.includes(numericLeagueId)) {
    return { shouldNoindex: true, reason: 'non-indexable-league' };
  }

  return { shouldNoindex: false, reason: null };
}

// 메모리 캐시 (컨테이너 내부 재사용)
const teamIndexableCache: Record<number, boolean> = {};

export async function hasIndexableTeamCompetition(teamId?: number | string | null): Promise<boolean> {
  const numericTeamId = typeof teamId === 'string' ? Number(teamId) : teamId;
  if (!numericTeamId || !Number.isFinite(numericTeamId)) return false;

  // 1. 메모리 캐시 확인
  if (teamIndexableCache[numericTeamId] !== undefined) {
    return teamIndexableCache[numericTeamId];
  }

  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('team_indexable_competitions')
      .select('team_id')
      .eq('team_id', numericTeamId)
      .limit(1);

    if (error) {
      console.error('[seoIndexability] team_indexable_competitions lookup failed:', error);
      return false;
    }

    const isIndexable = Array.isArray(data) && data.length > 0;
    // 2. 결과 메모리에 저장
    teamIndexableCache[numericTeamId] = isIndexable;
    return isIndexable;
  } catch (err) {
    console.error('[seoIndexability] 에러:', err);
    return false;
  }
}

export async function resolveTeamIndexability({
  teamId,
  leagueId,
  hasQueryState = false,
}: {
  teamId?: number | string | null;
  leagueId?: number | string | null;
  hasQueryState?: boolean;
}): Promise<{ shouldNoindex: boolean; reason: FootballNoindexReason | 'indexable-competition' }> {
  if (hasQueryState) {
    return { shouldNoindex: true, reason: 'query-state' };
  }

  if (await hasIndexableTeamCompetition(teamId)) {
    return { shouldNoindex: false, reason: 'indexable-competition' };
  }

  return resolveFootballIndexability({ leagueId });
}

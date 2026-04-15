'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 게시판용 팀 데이터 (football_teams 사용 — name_ko 우선, 없으면 name)
 * - 7일 캐시
 */
const _getCachedAllTeamsImpl = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('football_teams')
      .select('team_id, name, name_ko')
      .not('name_ko', 'is', null);

    if (error) {
      console.error('getCachedAllTeams error:', error);
      return [];
    }
    return (data || []).map((row: { team_id: number; name: string | null; name_ko: string | null }) => ({
      id: row.team_id,
      name: row.name_ko ?? row.name ?? '',
    }));
  },
  ['all-teams-football'],
  { revalidate: 604800, tags: ['football-teams', 'teams'] }
);

export async function getCachedAllTeams() {
  return _getCachedAllTeamsImpl();
}

/**
 * 게시판용 leagues 테이블
 * - 36개, 한글명 포함
 * - 7일 캐시
 */
const _getCachedAllLeaguesImpl = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, name_ko');

    if (error) {
      console.error('getCachedAllLeagues error:', error);
      return [];
    }
    return (data || []).map((row: { id: number; name: string | null; name_ko: string | null }) => ({
      id: row.id,
      name: row.name_ko ?? row.name ?? '',
    }));
  },
  ['all-leagues'],
  { revalidate: 604800, tags: ['leagues'] }
);

export async function getCachedAllLeagues() {
  return _getCachedAllLeaguesImpl();
}

/**
 * 여러 팀 ID로 필터링 (캐시된 데이터 사용)
 */
export async function getCachedTeamsByIds(teamIds: number[]): Promise<{ id: number; name: string }[]> {
  if (teamIds.length === 0) return [];
  const all = await getCachedAllTeams();
  const idSet = new Set(teamIds);
  return all.filter(t => idSet.has(t.id));
}

/**
 * 여러 리그 ID로 필터링 (캐시된 데이터 사용)
 */
export async function getCachedLeaguesByIds(leagueIds: number[]): Promise<{ id: number; name: string }[]> {
  if (leagueIds.length === 0) return [];
  const all = await getCachedAllLeagues();
  const idSet = new Set(leagueIds);
  return all.filter(l => idSet.has(l.id));
}

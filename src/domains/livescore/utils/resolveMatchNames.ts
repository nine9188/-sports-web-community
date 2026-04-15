import { getTeamsByIds, getLeagueById } from '@/domains/livescore/actions/teamLeagueData';

/** API 매치 데이터에서 한국어 팀명/리그명 해석 */
export async function resolveMatchNames(match: {
  league?: { id?: number; name?: string };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
}) {
  const teamIds: number[] = [];
  if (match.teams?.home?.id) teamIds.push(match.teams.home.id);
  if (match.teams?.away?.id) teamIds.push(match.teams.away.id);

  const [leagueInfo, teamMap] = await Promise.all([
    match.league?.id ? getLeagueById(match.league.id) : Promise.resolve(null),
    teamIds.length > 0 ? getTeamsByIds(teamIds) : Promise.resolve({}),
  ]);

  const homeInfo = match.teams?.home?.id ? teamMap[match.teams.home.id] : null;
  const awayInfo = match.teams?.away?.id ? teamMap[match.teams.away.id] : null;

  return {
    leagueName: leagueInfo?.name_ko || match.league?.name || '',
    homeName: homeInfo?.name_ko || match.teams?.home?.name || '',
    awayName: awayInfo?.name_ko || match.teams?.away?.name || '',
  };
}

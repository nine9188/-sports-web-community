import { getTeamById } from '../constants/teams/index';
import { getLeagueById } from '../constants/league-mappings';

/** API 매치 데이터에서 한국어 팀명/리그명 해석 */
export function resolveMatchNames(match: {
  league?: { id?: number; name?: string };
  teams?: {
    home?: { id?: number; name?: string };
    away?: { id?: number; name?: string };
  };
}) {
  const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
  const homeInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
  const awayInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;

  return {
    leagueName: leagueInfo?.nameKo || match.league?.name || '',
    homeName: homeInfo?.name_ko || match.teams?.home?.name || '',
    awayName: awayInfo?.name_ko || match.teams?.away?.name || '',
  };
}

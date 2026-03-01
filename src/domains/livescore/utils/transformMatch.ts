import { MatchData } from '../actions/footballApi';
import { Match } from '../types/match';
import { resolveMatchNames } from './resolveMatchNames';

const PLACEHOLDER_TEAM = '/images/placeholder-team.svg';
const PLACEHOLDER_LEAGUE = '/images/placeholder-league.svg';

/** MatchData (서버) → Match (클라이언트 UI) 변환. 한국어 팀명/리그명 매핑 포함. */
export function transformMatches(matchesData: MatchData[]): Match[] {
  return matchesData.map((match) => {
    const names = resolveMatchNames(match);

    return {
      id: match.id,
      status: {
        code: match.status.code,
        name: match.status.name,
        elapsed: match.status.elapsed,
      },
      time: {
        date: match.time.date,
        time: match.time.timestamp,
      },
      league: {
        id: match.league.id,
        name: names.leagueName || match.league.name,
        country: match.league.country,
        logo: match.league.logo || PLACEHOLDER_LEAGUE,
        logoDark: match.league.logoDark || '',
        flag: match.league.flag || '',
      },
      teams: {
        home: {
          id: match.teams.home.id,
          name: names.homeName || match.teams.home.name,
          img: match.teams.home.logo || PLACEHOLDER_TEAM,
          score: match.goals.home,
        },
        away: {
          id: match.teams.away.id,
          name: names.awayName || match.teams.away.name,
          img: match.teams.away.logo || PLACEHOLDER_TEAM,
          score: match.goals.away,
        },
      },
    };
  });
}

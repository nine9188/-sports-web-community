'use server'

import { fetchMatchesByDate } from '@/domains/livescore/actions/footballApi';

// 반환 타입 정의
export interface MatchFormData {
  id: string;
  fixture: {
    id: string;
    date: string;
  };
  league: {
    id: string;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: string;
      name: string;
      logo: string;
    };
    away: {
      id: string;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  status: {
    code: string;
    elapsed: number | null;
    name: string;
  };
}

export interface MatchesWithImages {
  matches: MatchFormData[];
  teamLogoUrls: Record<number, string>;
  leagueLogoUrls: Record<number, string>;
  leagueLogoUrlsDark: Record<number, string>;
}

export async function getMatchesByDate(date: string): Promise<MatchesWithImages> {
  try {
    // 실제 Football API에서 경기 데이터 가져오기
    // fetchMatchesByDate 내부에서 이미 팀/리그 Storage URL을 조회하므로 여기서 중복 조회하지 않음
    const matches = await fetchMatchesByDate(date);

    console.log(`[MatchForm] ${date} 경기 ${matches.length}건 조회됨`);

    if (matches.length === 0) {
      return {
        matches: [],
        teamLogoUrls: {},
        leagueLogoUrls: {},
        leagueLogoUrlsDark: {},
      };
    }

    // fetchMatchesByDate에서 반환된 데이터에 이미 Storage URL이 포함됨
    // teamLogoUrls 맵 구성 (UI에서 id → url 매핑용)
    const teamLogoUrls: Record<number, string> = {};
    const leagueLogoUrls: Record<number, string> = {};
    const leagueLogoUrlsDark: Record<number, string> = {};

    matches.forEach(match => {
      if (match.teams.home.logo) teamLogoUrls[match.teams.home.id] = match.teams.home.logo;
      if (match.teams.away.logo) teamLogoUrls[match.teams.away.id] = match.teams.away.logo;
      if (match.league.logo) leagueLogoUrls[match.league.id] = match.league.logo;
      if (match.league.logoDark) leagueLogoUrlsDark[match.league.id] = match.league.logoDark;
    });

    // 게시글 작성용 형식으로 변환
    const formattedMatches: MatchFormData[] = matches.map(match => ({
      id: match.id.toString(),
      fixture: {
        id: match.id.toString(),
        date: date
      },
      league: {
        id: match.league.id.toString(),
        name: match.league.name,
        logo: match.league.logo
      },
      teams: {
        home: {
          id: match.teams.home.id.toString(),
          name: match.teams.home.name,
          logo: match.teams.home.logo
        },
        away: {
          id: match.teams.away.id.toString(),
          name: match.teams.away.name,
          logo: match.teams.away.logo
        }
      },
      goals: {
        home: match.goals.home,
        away: match.goals.away
      },
      status: {
        code: match.status.code,
        elapsed: match.status.elapsed,
        name: match.status.name
      }
    }));

    return {
      matches: formattedMatches,
      teamLogoUrls,
      leagueLogoUrls,
      leagueLogoUrlsDark,
    };

  } catch (error) {
    console.error('[MatchForm] 경기 데이터 조회 중 오류 발생:', error);

    // API 오류 시 빈 데이터 반환
    return {
      matches: [],
      teamLogoUrls: {},
      leagueLogoUrls: {},
      leagueLogoUrlsDark: {},
    };
  }
}

export async function getMatchData(date: string) {
  // 실제 API 호출 로직
  return {
    matches: [],
    date
  };
} 
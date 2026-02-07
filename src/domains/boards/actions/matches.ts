'use server'

import { fetchMatchesByDate } from '@/domains/livescore/actions/footballApi';
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

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
    const matches = await fetchMatchesByDate(date);

    // 4590 표준: 모든 팀 ID와 리그 ID 수집
    const teamIds = new Set<number>();
    const leagueIds = new Set<number>();

    matches.forEach(match => {
      teamIds.add(match.teams.home.id);
      teamIds.add(match.teams.away.id);
      leagueIds.add(match.league.id);
    });

    // 4590 표준: 배치로 Storage URL 조회 (리그는 light/dark 둘 다)
    const [teamLogoUrls, leagueLogoUrls, leagueLogoUrlsDark] = await Promise.all([
      getTeamLogoUrls(Array.from(teamIds)),
      getLeagueLogoUrls(Array.from(leagueIds), false),
      getLeagueLogoUrls(Array.from(leagueIds), true),
    ]);

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
    console.error('경기 데이터 조회 중 오류 발생:', error);

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
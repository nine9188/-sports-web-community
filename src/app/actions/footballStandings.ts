'use server';

// 서버 액션에서 사용할 타입 정의
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

export interface StandingsData {
  league: League;
  standings: Standing[];
}

// API 응답 형식
interface ApiTeamStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

// 주요 리그 ID 목록
const MAJOR_LEAGUES: { [key: string]: number } = {
  premier: 39, // 프리미어리그
  laliga: 140, // 라리가
  bundesliga: 78, // 분데스리가
  serieA: 135, // 세리에 A
  ligue1: 61, // 리그앙
};

// 외부 API에서 스탠딩 데이터 가져오기
export async function fetchStandingsData(league: string = 'premier'): Promise<StandingsData | null> {
  try {
    // 리그 ID 결정
    const leagueId = MAJOR_LEAGUES[league] || MAJOR_LEAGUES.premier;
    
    // 현재 시즌 계산 (7월 기준)
    const currentDate = new Date();
    const season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    // CORS 오류를 방지하기 위해 서버 측에서만 API 호출
    const standingsResponse = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        next: { revalidate: 86400 } // 24시간 캐싱
      }
    );

    if (!standingsResponse.ok) {
      throw new Error(`API 응답 오류: ${standingsResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    
    // 리그 정보 및 스탠딩 데이터 추출
    const leagueInfo = standingsData.response?.[0]?.league || {};
    const standings = leagueInfo.standings?.[0] || [];
    
    // 필요한 데이터만 추출
    return {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        logo: leagueInfo.logo,
        country: leagueInfo.country
      },
      standings: standings.map((team: ApiTeamStanding) => ({
        rank: team.rank,
        team: {
          id: team.team.id,
          name: team.team.name,
          logo: team.team.logo
        },
        points: team.points,
        goalsDiff: team.goalsDiff,
        form: team.form,
        all: {
          played: team.all.played,
          win: team.all.win,
          draw: team.all.draw,
          lose: team.all.lose
        }
      }))
    };
  } catch (error) {
    console.error('Error fetching league standings:', error);
    return null;
  }
} 
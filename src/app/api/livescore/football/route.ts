import { NextResponse } from 'next/server';

// 매치 데이터 인터페이스 정의
interface MatchData {
  fixture: {
    id: number;
    timestamp: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

// 주요 리그 ID 목록
const MAJOR_LEAGUE_IDS = [
  39,  // Premier League (잉글랜드)
  140, // La Liga (스페인)
  78,  // Bundesliga (독일)
  61,  // Ligue 1 (프랑스)
  135, // Serie A (이탈리아)
  88,  // Eredivisie (네덜란드)
  94,  // Primeira Liga (포르투갈)
  292, // K League 1 (한국)
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  848  // UEFA Europa Conference League
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const apiUrl = date 
      ? `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Asia/Seoul`
      : `https://v3.football.api-sports.io/fixtures?live=all&timezone=Asia/Seoul`;

    const response = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY as string
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error('API 요청 실패');
    }

    const data = await response.json();
    
    const mappedData = data.response
      .filter((match: MatchData) => MAJOR_LEAGUE_IDS.includes(match.league.id))
      .map((match: MatchData) => ({
        id: match.fixture.id,
        status: {
          code: match.fixture.status.short,
          name: match.fixture.status.long,
          elapsed: match.fixture.status.elapsed
        },
        time: {
          timestamp: match.fixture.timestamp,
          date: match.fixture.date,
          timezone: 'Asia/Seoul'
        },
        league: {
          id: match.league.id,
          name: match.league.name,
          country: match.league.country,
          logo: match.league.logo,
          flag: match.league.flag
        },
        teams: {
          home: {
            id: match.teams.home.id,
            name: match.teams.home.name,
            logo: match.teams.home.logo,
            winner: match.teams.home.winner
          },
          away: {
            id: match.teams.away.id,
            name: match.teams.away.name,
            logo: match.teams.away.logo,
            winner: match.teams.away.winner
          }
        },
        goals: {
          home: match.goals.home || 0,
          away: match.goals.away || 0
        },
        score: {
          halftime: {
            home: match.score.halftime.home || 0,
            away: match.score.halftime.away || 0
          },
          fulltime: {
            home: match.score.fulltime.home || 0,
            away: match.score.fulltime.away || 0
          },
          extratime: {
            home: match.score.extratime.home || 0,
            away: match.score.extratime.away || 0
          },
          penalty: {
            home: match.score.penalty.home || 0,
            away: match.score.penalty.away || 0
          }
        }
      }));

    return NextResponse.json({
      success: true,
      data: mappedData
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '데이터를 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

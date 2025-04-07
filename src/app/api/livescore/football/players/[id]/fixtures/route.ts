import { NextResponse } from 'next/server';

// 필요한 인터페이스 정의
interface Fixture {
  id: number;
  date: string;
  status: {
    short: string;
    [key: string]: unknown;
  };
  timestamp: number;
}

interface League {
  id: number;
  name: string;
  logo: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

interface Goals {
  home: number | null;
  away: number | null;
}

interface Score {
  halftime: {
    home: number | null;
    away: number | null;
  };
  fulltime: {
    home: number | null;
    away: number | null;
  };
  [key: string]: unknown;
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: Score;
}

export async function GET(request: Request) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const playerId = pathname.split('/players/')[1].split('/')[0];
    const season = searchParams.get('season') || '2023';
    const league = searchParams.get('league') || '';
    const page = Number(searchParams.get('page')) || 1;
    const per_page = 10;  // 페이지당 아이템 수

    // 1. 팀 ID를 가져오기 위해 선수 정보를 조회
    const playerUrl = `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`;
    const playerResponse = await fetch(playerUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store'
    });

    if (!playerResponse.ok) {
      throw new Error('Failed to fetch player data');
    }

    const playerData = await playerResponse.json();
    if (!playerData.response?.[0]?.statistics?.[0]?.team?.id) {
      return NextResponse.json([]);
    }

    const teamId = playerData.response[0].statistics[0].team.id;

    // 2. 팀 ID로 경기 목록 조회 (페이지네이션 적용)
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?` +
      `team=${teamId}` +
      `&season=${season}` +
      `${league ? `&league=${league}` : ''}` +
      `&from=${season}-07-01` +  // 시즌 시작일
      `&to=${Number(season) + 1}-06-30`;  // 시즌 종료일

    const fixturesResponse = await fetch(fixturesUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store'
    });

    if (!fixturesResponse.ok) {
      throw new Error('Failed to fetch fixtures');
    }

    const fixturesData = await fixturesResponse.json();
    if (!fixturesData.response || fixturesData.response.length === 0) {
      return NextResponse.json([]);
    }

    // 3. 각 경기의 선수 통계 가져오기
    const fixturesWithStats = await Promise.all(
      fixturesData.response.map(async (fixture: FixtureResponse, index: number) => {
        // API 호출 간격 조절 (429 에러 방지)
        await delay(index * 200);  // 각 요청 사이에 200ms 간격
        
        const fixtureId = fixture.fixture.id;
        const fixtureStatsUrl = `https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`;
        
        try {
          const statsResponse = await fetch(fixtureStatsUrl, {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
            },
            next: { revalidate: 3600 }  // 1시간 캐싱
          });

          if (!statsResponse.ok) {
            throw new Error('Failed to fetch fixture stats');
          }

          const statsData = await statsResponse.json();
          
          // 해당 선수의 통계 찾기
          let playerStats = null;
          if (statsData.response && statsData.response.length > 0) {
            for (const teamStats of statsData.response) {
              const playerData = teamStats.players.find((p: { player: { id: number } }) => p.player.id === Number(playerId));
              if (playerData) {
                playerStats = playerData.statistics[0];
                break;
              }
            }
          }

          // 기본 통계 데이터 구조
          const defaultStats = {
            games: { 
              minutes: 0, 
              rating: null,
              position: null,
              number: null 
            },
            shots: { 
              total: 0, 
              on: 0 
            },
            goals: { 
              total: 0, 
              assists: 0,
              conceded: 0,
              saves: null
            },
            passes: {
              total: 0,
              key: 0,
              accuracy: "0"
            },
            cards: { 
              yellow: 0, 
              red: 0 
            }
          };

          // 실제 통계 데이터와 기본값 병합
          const mergedStats = {
            ...defaultStats,
            ...playerStats,
            games: {
              ...defaultStats.games,
              ...(playerStats?.games || {})
            },
            shots: {
              ...defaultStats.shots,
              ...(playerStats?.shots || {})
            },
            goals: {
              ...defaultStats.goals,
              ...(playerStats?.goals || {})
            },
            passes: {
              ...defaultStats.passes,
              ...(playerStats?.passes || {})
            },
            cards: {
              ...defaultStats.cards,
              ...(playerStats?.cards || {})
            }
          };

          return {
            fixture: {
              id: fixture.fixture.id,
              date: fixture.fixture.date,
              status: fixture.fixture.status,
              timestamp: fixture.fixture.timestamp
            },
            league: {
              id: fixture.league.id,
              name: fixture.league.name,
              logo: fixture.league.logo,  // 원본 URL 사용
            },
            teams: {
              home: {
                id: fixture.teams.home.id,
                name: fixture.teams.home.name,
                logo: fixture.teams.home.logo,  // 원본 URL 사용
                winner: fixture.teams.home.winner,
              },
              away: {
                id: fixture.teams.away.id,
                name: fixture.teams.away.name,
                logo: fixture.teams.away.logo,  // 원본 URL 사용
                winner: fixture.teams.away.winner,
              },
              playerTeamId: teamId
            },
            goals: fixture.goals,
            score: fixture.score,
            statistics: mergedStats
          };
        } catch {
          return null;
        }
      })
    );

    // 날짜순 정렬 (최신순) 및 null 값과 진행되지 않은 경기 필터링
    const sortedFixtures = fixturesWithStats
      .filter(fixture => 
        fixture !== null && 
        fixture.fixture.status.short === "FT" &&  // FT (Full Time) 상태인 경기만 포함
        fixture.statistics.games.minutes > 0  // 출전 시간이 있는 경기만 포함
      )
      .sort((a, b) => 
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
      );

    // 페이지네이션 적용
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedFixtures = sortedFixtures.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedFixtures,
      pagination: {
        total: sortedFixtures.length,
        page: page,
        per_page: per_page,
        total_pages: Math.ceil(sortedFixtures.length / per_page)
      }
    });
    
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fixtures data' }, { status: 500 });
  }
}

// API 호출 간격 조절을 위한 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
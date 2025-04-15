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

// 더 구체적인 반환 타입 정의
interface ProcessedFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      [key: string]: unknown;
    };
    timestamp: number;
  };
  league: {
    id: number;
    name: string;
    logo: string;
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
    playerTeamId: number;
  };
  goals: Goals;
  score: Score;
  statistics: {
    games: { minutes: number; rating: number | null; position: string | null; number: number | null };
    shots: { total: number; on: number };
    goals: { total: number; assists: number; conceded: number; saves: number | null };
    passes: { total: number; key: number; accuracy: string };
    cards: { yellow: number; red: number };
    [key: string]: unknown;
  };
}

export async function GET(request: Request) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const playerId = pathname.split('/players/')[1].split('/')[0];
    const season = searchParams.get('season') || '2023';
    const league = searchParams.get('league') || '';
    
    // 캐싱 파라미터 추가
    const cacheAge = Number(searchParams.get('cache_age')) || 86400;  // 기본 1일(24시간) 캐싱

    console.log(`Fixtures API called for player ${playerId}, season ${season}`);
    
    // 1. 팀 ID를 가져오기 위해 선수 정보를 조회 (캐싱 적용)
    const playerUrl = `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`;
    const playerResponse = await fetch(playerUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      next: { revalidate: cacheAge }  // 캐싱 적용 (기본 24시간)
    });

    if (!playerResponse.ok) {
      console.error(`Failed to fetch player data: ${playerResponse.status}`);
      throw new Error('Failed to fetch player data');
    }

    const playerData = await playerResponse.json();
    if (!playerData.response?.[0]?.statistics?.[0]?.team?.id) {
      console.log(`No team data found for player ${playerId}`);
      return NextResponse.json({ data: [] });
    }

    const teamId = playerData.response[0].statistics[0].team.id;
    console.log(`Team ID for player ${playerId}: ${teamId}`);

    // 2. 팀 ID로 경기 목록 조회 (캐싱 적용)
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?` +
      `team=${teamId}` +
      `&season=${season}` +
      `${league ? `&league=${league}` : ''}` +
      `&from=${season}-07-01` +  // 시즌 시작일
      `&to=${Number(season) + 1}-06-30`;  // 시즌 종료일

    console.log(`Fetching fixtures from: ${fixturesUrl}`);
    const fixturesResponse = await fetch(fixturesUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      next: { revalidate: cacheAge }  // 캐싱 적용 (기본 24시간)
    });

    if (!fixturesResponse.ok) {
      console.error(`Failed to fetch fixtures: ${fixturesResponse.status}`);
      throw new Error('Failed to fetch fixtures');
    }

    const fixturesData = await fixturesResponse.json();
    if (!fixturesData.response || fixturesData.response.length === 0) {
      console.log(`No fixtures found for team ${teamId} in season ${season}`);
      return NextResponse.json({ data: [] });
    }

    console.log(`Found ${fixturesData.response.length} fixtures for team ${teamId}`);

    // 3. 각 경기의 선수 통계 가져오기 - 최적화된 방식
    // 한 번에 가져올 경기 수 늘림 (병렬성 향상)
    const chunkSize = 10; // 한 번에 10개 경기 통계 병렬 처리 (기존 5개에서 증가)
    let fixturesWithStats: (ProcessedFixture | null)[] = [];
    
    // 경기를 일정 수의 청크로 나누어 처리
    for (let i = 0; i < fixturesData.response.length; i += chunkSize) {
      const chunk = fixturesData.response.slice(i, i + chunkSize);
      console.log(`Processing fixtures chunk ${i / chunkSize + 1} (${chunk.length} fixtures)`);
      
      // 각 청크에 대해 병렬로 처리
      const chunkResults = await Promise.all(
        chunk.map(async (fixture: FixtureResponse) => {
          const fixtureId = fixture.fixture.id;
          const fixtureStatsUrl = `https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`;
          
          try {
            const statsResponse = await fetch(fixtureStatsUrl, {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
              },
              next: { revalidate: 86400 * 7 }  // 7일 캐싱 (경기 통계는 변경되지 않음)
            });

            if (!statsResponse.ok) {
              console.warn(`Failed to fetch stats for fixture ${fixtureId}: ${statsResponse.status}`);
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
                logo: fixture.league.logo,
              },
              teams: {
                home: {
                  id: fixture.teams.home.id,
                  name: fixture.teams.home.name,
                  logo: fixture.teams.home.logo,
                  winner: fixture.teams.home.winner,
                },
                away: {
                  id: fixture.teams.away.id,
                  name: fixture.teams.away.name,
                  logo: fixture.teams.away.logo,
                  winner: fixture.teams.away.winner,
                },
                playerTeamId: teamId
              },
              goals: fixture.goals,
              score: fixture.score,
              statistics: mergedStats
            };
          } catch (error) {
            console.error(`Error processing fixture ${fixtureId}:`, error);
            return null;
          }
        })
      );
      
      fixturesWithStats = fixturesWithStats.concat(chunkResults);
    }

    // 날짜순 정렬 (최신순) 및 null 값과 진행되지 않은 경기 필터링
    const sortedFixtures = fixturesWithStats
      .filter((fixture): fixture is ProcessedFixture => 
        fixture !== null && 
        fixture?.fixture?.status?.short === "FT" &&  // FT (Full Time) 상태인 경기만 포함
        fixture?.statistics?.games?.minutes > 0  // 출전 시간이 있는 경기만 포함
      )
      .sort((a, b) => 
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
      );

    console.log(`Total valid fixtures: ${sortedFixtures.length}`);

    return NextResponse.json({
      data: sortedFixtures,
      total: sortedFixtures.length
    });
    
  } catch (error) {
    console.error('Error in fixtures API:', error);
    return NextResponse.json({ error: 'Failed to fetch fixtures data' }, { status: 500 });
  }
}
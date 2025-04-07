import { NextResponse } from 'next/server';

// 인터페이스 정의
interface Transfer {
  date?: string;
  type?: string;
  teams?: {
    out?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    in?: {
      id?: number;
      name?: string;
      logo?: string;
    };
  };
}

interface Injury {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  fixture?: {
    id?: number;
    date?: string;
  };
  league?: {
    id?: number;
    name?: string;
    season?: string;
  };
  player?: {
    type?: string;
    reason?: string;
  };
}

interface Trophy {
  league?: string;
  country?: string;
  season?: string;
  place?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentSeason = 2024;  // 현재 시즌으로 수정

    // 1. 기본 선수 정보 가져오기
    const playerResponse = await fetch(
      `https://v3.football.api-sports.io/players?id=${id}&season=${currentSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!playerResponse.ok) {
      throw new Error(`API response not ok: ${playerResponse.status}`);
    }

    const playerData = await playerResponse.json();

    // API 응답이 없거나 비어있는 경우
    if (!playerData.response || playerData.response.length === 0) {
      // 이전 시즌 데이터 시도
      const lastSeasonResponse = await fetch(
        `https://v3.football.api-sports.io/players?id=${id}&season=${currentSeason-1}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      if (!lastSeasonResponse.ok) {
        throw new Error('Failed to fetch player data from last season');
      }

      const lastSeasonData = await lastSeasonResponse.json();
      if (!lastSeasonData.response || lastSeasonData.response.length === 0) {
        return NextResponse.json(
          { error: 'Player data not available' },
          { status: 404 }
        );
      }
      playerData.response = lastSeasonData.response;
    }

    // 2. 이적 기록 가져오기
    const transfersResponse = await fetch(
      `https://v3.football.api-sports.io/transfers?player=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );
    const transfersData = transfersResponse.ok ? await transfersResponse.json() : { response: [] };

    // 3. 부상 기록 가져오기
    const injuriesResponse = await fetch(
      `https://v3.football.api-sports.io/injuries?player=${id}&season=${currentSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );
    const injuriesData = injuriesResponse.ok ? await injuriesResponse.json() : { response: [] };

    // 4. 트로피 기록 가져오기
    const trophiesResponse = await fetch(
      `https://v3.football.api-sports.io/trophies?player=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );
    const trophiesData = trophiesResponse.ok ? await trophiesResponse.json() : { response: [] };

    // 5. 이전 시즌들의 통계 가져오기 (최근 3시즌)
    const previousSeasons = [];
    for (let i = 1; i <= 3; i++) {
      const season = currentSeason - i;
      const seasonResponse = await fetch(
        `https://v3.football.api-sports.io/players?id=${id}&season=${season}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );
      
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json();
        if (seasonData.response && seasonData.response.length > 0) {
          previousSeasons.push({
            season,
            data: seasonData.response[0]
          });
        }
      }
    }

    const player = playerData.response[0];

    const formattedData = {
      info: {
        id: player?.player?.id || 0,
        name: player?.player?.name || '',
        firstname: player?.player?.firstname || '',
        lastname: player?.player?.lastname || '',
        age: player?.player?.age || 0,
        birth: {
          date: player?.player?.birth?.date || '',
          place: player?.player?.birth?.place || '',
          country: player?.player?.birth?.country || '',
        },
        nationality: player?.player?.nationality || '',
        height: player?.player?.height || '',
        weight: player?.player?.weight || '',
        injured: player?.player?.injured || false,
        photo: player?.player?.photo || '',
      },
      statistics: player?.statistics?.[0] ? {
        team: {
          id: player.statistics[0].team?.id || 0,
          name: player.statistics[0].team?.name || '',
          logo: player.statistics[0].team?.logo || '',
        },
        league: {
          id: player.statistics[0].league?.id || 0,
          name: player.statistics[0].league?.name || '',
          country: player.statistics[0].league?.country || '',
          logo: player.statistics[0].league?.logo || '',
          season: player.statistics[0].league?.season || currentSeason,
        },
        games: {
          appearances: player.statistics[0].games?.appearences || 0,
          lineups: player.statistics[0].games?.lineups || 0,
          minutes: player.statistics[0].games?.minutes || 0,
          position: player.statistics[0].games?.position || '',
          rating: player.statistics[0].games?.rating || '',
          captain: player.statistics[0].games?.captain || false,
        },
        goals: {
          total: player.statistics[0].goals?.total || 0,
          assists: player.statistics[0].goals?.assists || 0,
          saves: player.statistics[0].goals?.saves || 0,
          conceded: player.statistics[0].goals?.conceded || 0,
          cleansheets: player.statistics[0].goals?.cleansheets || 0,
        },
        passes: {
          total: player.statistics[0].passes?.total || 0,
          key: player.statistics[0].passes?.key || 0,
          accuracy: player.statistics[0].passes?.accuracy || 0,
        },
        tackles: {
          total: player.statistics[0].tackles?.total || 0,
          blocks: player.statistics[0].tackles?.blocks || 0,
          interceptions: player.statistics[0].tackles?.interceptions || 0,
        },
        duels: {
          total: player.statistics[0].duels?.total || 0,
          won: player.statistics[0].duels?.won || 0,
        },
        dribbles: {
          attempts: player.statistics[0].dribbles?.attempts || 0,
          success: player.statistics[0].dribbles?.success || 0,
          past: player.statistics[0].dribbles?.past || 0,
        },
        fouls: {
          drawn: player.statistics[0].fouls?.drawn || 0,
          committed: player.statistics[0].fouls?.committed || 0,
        },
        cards: {
          yellow: player.statistics[0].cards?.yellow || 0,
          yellowred: player.statistics[0].cards?.yellowred || 0,
          red: player.statistics[0].cards?.red || 0,
        },
        penalty: {
          won: player.statistics[0].penalty?.won || 0,
          committed: player.statistics[0].penalty?.committed || 0,
          scored: player.statistics[0].penalty?.scored || 0,
          missed: player.statistics[0].penalty?.missed || 0,
          saved: player.statistics[0].penalty?.saved || 0,
        }
      } : null,
      transfers: transfersData.response.map((transfer: Transfer) => {
        return {
          date: transfer.date || '',
          type: transfer.type || '',
          teams: {
            from: {
              id: transfer.teams?.out?.id || 0,
              name: transfer.teams?.out?.name || '',
              logo: transfer.teams?.out?.logo || '',
            },
            to: {
              id: transfer.teams?.in?.id || 0,
              name: transfer.teams?.in?.name || '',
              logo: transfer.teams?.in?.logo || '',
            }
          }
        };
      }),
      injuries: injuriesData.response.map((injury: Injury) => ({
        team: {
          id: injury.team?.id || 0,
          name: injury.team?.name || '',
          logo: injury.team?.logo || '',
        },
        fixture: {
          id: injury.fixture?.id || 0,
          date: injury.fixture?.date || '',
        },
        league: {
          id: injury.league?.id || 0,
          name: injury.league?.name || '',
          season: injury.league?.season || '',
        },
        type: injury.player?.type || '',
        reason: injury.player?.reason || '',
      })),
      trophies: trophiesData.response.map((trophy: Trophy) => ({
        league: trophy.league || '',
        country: trophy.country || '',
        season: trophy.season || '',
        place: trophy.place || '',
      })),
      seasonHistory: previousSeasons.map(season => {
        const stats = season.data.statistics[0] || {};
        return {
          season: season.season,
          team: {
            id: stats.team?.id || 0,
            name: stats.team?.name || '',
            logo: stats.team?.logo || '',
          },
          league: {
            id: stats.league?.id || 0,
            name: stats.league?.name || '',
            country: stats.league?.country || '',
          },
          games: {
            appearances: stats.games?.appearences || 0,
            minutes: stats.games?.minutes || 0,
          },
          goals: {
            total: stats.goals?.total || 0,
            assists: stats.goals?.assists || 0,
          },
          cards: {
            yellow: stats.cards?.yellow || 0,
            red: stats.cards?.red || 0,
          },
          rating: stats.games?.rating || '',
        };
      }),
    };

    return NextResponse.json(formattedData);
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch player data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

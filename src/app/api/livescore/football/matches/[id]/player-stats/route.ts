import { NextResponse } from 'next/server';

// 선수 정보 및 통계 관련 인터페이스 정의
interface Player {
  id: number;
  name: string;
  photo: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
  update?: string;
}

interface PlayerGames {
  minutes?: number;
  number?: number;
  position?: string;
  rating?: string;
  captain?: boolean;
  substitute?: boolean;
}

interface PlayerShots {
  total?: number;
  on?: number;
}

interface PlayerGoals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
}

interface PlayerPasses {
  total?: number;
  key?: number;
  accuracy?: string;
}

interface PlayerTackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
}

interface PlayerDuels {
  total?: number;
  won?: number;
}

interface PlayerDribbles {
  attempts?: number;
  success?: number;
  past?: number;
}

interface PlayerFouls {
  drawn?: number;
  committed?: number;
}

interface PlayerCards {
  yellow?: number;
  red?: number;
}

interface PlayerPenalty {
  won?: number;
  committed?: number;
  scored?: number;
  missed?: number;
  saved?: number;
}

interface PlayerStatistics {
  games: PlayerGames;
  offsides?: number;
  shots?: PlayerShots;
  goals?: PlayerGoals;
  passes?: PlayerPasses;
  tackles?: PlayerTackles;
  duels?: PlayerDuels;
  dribbles?: PlayerDribbles;
  fouls?: PlayerFouls;
  cards?: PlayerCards;
  penalty?: PlayerPenalty;
}

interface PlayerStats {
  player: Player;
  statistics: PlayerStatistics[];
}

interface FormattedPlayerStats {
  player: {
    id: number;
    name: string;
    photo: string;
    number?: number;
    pos?: string;
  };
  statistics: {
    team: Team;
    games: PlayerGames;
    offsides?: number;
    shots: PlayerShots;
    goals: PlayerGoals;
    passes: PlayerPasses;
    tackles: PlayerTackles;
    duels: PlayerDuels;
    dribbles: PlayerDribbles;
    fouls: PlayerFouls;
    cards: PlayerCards;
    penalty: PlayerPenalty;
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const playerIds = searchParams.get('playerIds');
  
  // playerId나 playerIds 중 하나는 필요
  if (!playerId && !playerIds) {
    return NextResponse.json({ error: 'Player ID or Player IDs are required' }, { status: 400 });
  }

  try {
    // 외부 API에서 경기의 모든 선수 통계를 한 번에 가져옴
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch player statistics');
    }

    const data = await response.json();
    
    // 단일 선수 ID 요청 처리
    if (playerId) {
      // 해당 선수의 통계 찾기
      let playerStats = null;
      for (const teamStats of data.response) {
        const player = teamStats.players.find((p: PlayerStats) => p.player.id === Number(playerId));
        if (player) {
          playerStats = {
            player: player.player,
            statistics: player.statistics,
            team: teamStats.team
          };
          break;
        }
      }

      if (!playerStats) {
        return NextResponse.json({ response: [] });
      }

      // 응답 데이터 구성
      return NextResponse.json({
        response: [{
          player: {
            id: playerStats.player.id,
            name: playerStats.player.name,
            photo: playerStats.player.photo,
            number: playerStats.statistics[0].games.number,
            pos: playerStats.statistics[0].games.position
          },
          statistics: [{
            team: {
              id: playerStats.team.id,
              name: playerStats.team.name,
              logo: playerStats.team.logo,
              update: playerStats.team.update
            },
            games: {
              minutes: playerStats.statistics[0].games.minutes || 0,
              number: playerStats.statistics[0].games.number,
              position: playerStats.statistics[0].games.position,
              rating: playerStats.statistics[0].games.rating || '-',
              captain: playerStats.statistics[0].games.captain || false,
              substitute: playerStats.statistics[0].games.substitute || false
            },
            offsides: playerStats.statistics[0].offsides,
            shots: {
              total: playerStats.statistics[0].shots?.total || 0,
              on: playerStats.statistics[0].shots?.on || 0
            },
            goals: {
              total: playerStats.statistics[0].goals?.total || 0,
              conceded: playerStats.statistics[0].goals?.conceded,
              assists: playerStats.statistics[0].goals?.assists || 0,
              saves: playerStats.statistics[0].goals?.saves
            },
            passes: {
              total: playerStats.statistics[0].passes?.total || 0,
              key: playerStats.statistics[0].passes?.key || 0,
              accuracy: playerStats.statistics[0].passes?.accuracy || '0'
            },
            tackles: {
              total: playerStats.statistics[0].tackles?.total || 0,
              blocks: playerStats.statistics[0].tackles?.blocks || 0,
              interceptions: playerStats.statistics[0].tackles?.interceptions || 0
            },
            duels: {
              total: playerStats.statistics[0].duels?.total || 0,
              won: playerStats.statistics[0].duels?.won || 0
            },
            dribbles: {
              attempts: playerStats.statistics[0].dribbles?.attempts || 0,
              success: playerStats.statistics[0].dribbles?.success || 0,
              past: playerStats.statistics[0].dribbles?.past
            },
            fouls: {
              drawn: playerStats.statistics[0].fouls?.drawn || 0,
              committed: playerStats.statistics[0].fouls?.committed || 0
            },
            cards: {
              yellow: playerStats.statistics[0].cards?.yellow || 0,
              red: playerStats.statistics[0].cards?.red || 0
            },
            penalty: {
              won: playerStats.statistics[0].penalty?.won || 0,
              committed: playerStats.statistics[0].penalty?.committed || 0,
              scored: playerStats.statistics[0].penalty?.scored || 0,
              missed: playerStats.statistics[0].penalty?.missed || 0,
              saved: playerStats.statistics[0].penalty?.saved || 0
            }
          }]
        }]
      });
    }
    
    // 여러 선수 ID 요청 처리
    if (playerIds) {
      // 요청된 선수 ID 배열로 변환
      const requestedPlayerIds = playerIds.split(',').map(id => Number(id));
      
      // 결과를 저장할 객체
      const playersStatsMap: Record<number, { response: FormattedPlayerStats[] }> = {};
      
      // 모든 팀의 선수 데이터를 순회하며 요청된 선수 통계 찾기
      for (const teamStats of data.response) {
        for (const player of teamStats.players) {
          // 요청된 선수 ID 목록에 있는 선수만 처리
          if (requestedPlayerIds.includes(player.player.id)) {
            const playerStats = {
              player: {
                id: player.player.id,
                name: player.player.name,
                photo: player.player.photo,
                number: player.statistics[0].games.number,
                pos: player.statistics[0].games.position
              },
              statistics: [{
                team: {
                  id: teamStats.team.id,
                  name: teamStats.team.name,
                  logo: teamStats.team.logo,
                  update: teamStats.team.update
                },
                games: {
                  minutes: player.statistics[0].games.minutes || 0,
                  number: player.statistics[0].games.number,
                  position: player.statistics[0].games.position,
                  rating: player.statistics[0].games.rating || '-',
                  captain: player.statistics[0].games.captain || false,
                  substitute: player.statistics[0].games.substitute || false
                },
                offsides: player.statistics[0].offsides,
                shots: {
                  total: player.statistics[0].shots?.total || 0,
                  on: player.statistics[0].shots?.on || 0
                },
                goals: {
                  total: player.statistics[0].goals?.total || 0,
                  conceded: player.statistics[0].goals?.conceded,
                  assists: player.statistics[0].goals?.assists || 0,
                  saves: player.statistics[0].goals?.saves
                },
                passes: {
                  total: player.statistics[0].passes?.total || 0,
                  key: player.statistics[0].passes?.key || 0,
                  accuracy: player.statistics[0].passes?.accuracy || '0'
                },
                tackles: {
                  total: player.statistics[0].tackles?.total || 0,
                  blocks: player.statistics[0].tackles?.blocks || 0,
                  interceptions: player.statistics[0].tackles?.interceptions || 0
                },
                duels: {
                  total: player.statistics[0].duels?.total || 0,
                  won: player.statistics[0].duels?.won || 0
                },
                dribbles: {
                  attempts: player.statistics[0].dribbles?.attempts || 0,
                  success: player.statistics[0].dribbles?.success || 0,
                  past: player.statistics[0].dribbles?.past
                },
                fouls: {
                  drawn: player.statistics[0].fouls?.drawn || 0,
                  committed: player.statistics[0].fouls?.committed || 0
                },
                cards: {
                  yellow: player.statistics[0].cards?.yellow || 0,
                  red: player.statistics[0].cards?.red || 0
                },
                penalty: {
                  won: player.statistics[0].penalty?.won || 0,
                  committed: player.statistics[0].penalty?.committed || 0,
                  scored: player.statistics[0].penalty?.scored || 0,
                  missed: player.statistics[0].penalty?.missed || 0,
                  saved: player.statistics[0].penalty?.saved || 0
                }
              }]
            };
            
            // 선수 ID를 키로 사용하여 결과 객체에 저장
            playersStatsMap[player.player.id] = {
              response: [playerStats]
            };
          }
        }
      }

      // 응답 데이터 반환
      return NextResponse.json(playersStatsMap);
    }
    
  } catch {
    // console.error('Error fetching player statistics:', error); // 로그 제거
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' }, 
      { status: 500 }
    );
  }
} 
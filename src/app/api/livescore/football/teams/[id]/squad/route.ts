import { NextResponse } from 'next/server';

// 플레이어 인터페이스 정의
interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

// 선수들을 그룹으로 나누는 유틸리티 함수
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const season = 2024;
    
    // 1. 선수단 목록 가져오기 (캐시 적용)
    const squadResponse = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'  // Next.js의 Route Cache 활용
      }
    );

    if (!squadResponse.ok) {
      throw new Error(`Squad API 응답 오류: ${squadResponse.status}`);
    }

    const squadData = await squadResponse.json();
    const players = squadData.response[0]?.players || [];

    // 2. 선수들을 5명씩 그룹으로 나누기
    const playerChunks = chunkArray<SquadPlayer>(players, 5);
    
    // 3. 각 그룹별로 통계 가져오기
    const playersWithStats = [];
    
    // 선수 통계 가져오기 (캐시 적용)
    for (const chunk of playerChunks) {
      const chunkStats = await Promise.all(
        chunk.map(async (player: SquadPlayer) => {
          const statsResponse = await fetch(
            `https://v3.football.api-sports.io/players?id=${player.id}&season=${season}&team=${id}`,
            {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
              },
              cache: 'no-store'  // Next.js의 Route Cache 활용
            }
          );

          if (!statsResponse.ok) {
            return {
              ...player as object,
              stats: {
                appearances: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            };
          }

          const statsData = await statsResponse.json();
          const playerStats = statsData.response[0]?.statistics[0] || {};

          return {
            ...player as object,
            stats: {
              appearances: playerStats.games?.appearences || 0,
              goals: playerStats.goals?.total || 0,
              assists: playerStats.goals?.assists || 0,
              yellowCards: playerStats.cards?.yellow || 0,
              redCards: playerStats.cards?.red || 0
            }
          };
        })
      );
      
      playersWithStats.push(...chunkStats);
      
    }

    return NextResponse.json(playersWithStats);

  } catch (error: unknown) {
    console.error('Error fetching squad data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad data' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

// 주요 리그 ID 목록
const MAJOR_LEAGUES: { [key: string]: number } = {
  premier: 39, // 프리미어리그
  laliga: 140, // 라리가
  bundesliga: 78, // 분데스리가
  serieA: 135, // 세리에 A
  ligue1: 61, // 리그앙
};

export async function GET(request: Request) {
  try {
    // 현재 시즌 계산 (7월 기준)
    const currentDate = new Date();
    const season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    // URL에서 리그 파라미터 추출
    const { searchParams } = new URL(request.url);
    const leagueParam = searchParams.get('league');
    
    // 요청한 리그 ID 결정 (기본값: 프리미어리그)
    let leagueId = MAJOR_LEAGUES.premier;
    if (leagueParam && MAJOR_LEAGUES[leagueParam]) {
      leagueId = MAJOR_LEAGUES[leagueParam];
    }
    
    // 스탠딩 데이터 요청
    const standingsResponse = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!standingsResponse.ok) {
      throw new Error(`API 응답 오류: ${standingsResponse.status}`);
    }

    const standingsData = await standingsResponse.json();
    
    // 리그 정보 및 스탠딩 데이터 추출
    const leagueInfo = standingsData.response?.[0]?.league || {};
    const standings = leagueInfo.standings?.[0] || [];
    
    interface TeamStanding {
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
    
    // 필요한 데이터만 반환 (제한 없이 모든 팀 반환)
    return NextResponse.json({
      data: {
        league: {
          id: leagueInfo.id,
          name: leagueInfo.name,
          logo: leagueInfo.logo,
          country: leagueInfo.country
        },
        standings: standings.map((team: TeamStanding) => ({
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
      }
    });
    
  } catch (error) {
    console.error('Error fetching league standings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch standings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 
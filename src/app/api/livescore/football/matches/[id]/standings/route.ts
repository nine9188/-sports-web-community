import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  
  try {
    // 먼저 매치 정보를 가져와서 리그 ID를 얻습니다
    const matchResponse = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!matchResponse.ok) {
      throw new Error('Failed to fetch match data');
    }

    const matchData = await matchResponse.json();
    const matchDetails = matchData.response?.[0];
    
    if (!matchDetails) {
      throw new Error('Match details not found');
    }
    
    // 홈/어웨이 팀 정보 추출
    const homeTeam = matchDetails.teams?.home;
    const awayTeam = matchDetails.teams?.away;
    
    // 리그 정보 추출
    const leagueId = matchDetails.league?.id;
    const season = matchDetails.league?.season;

    if (!leagueId || !season) {
      throw new Error('League information not found');
    }

    // 리그 순위 정보를 가져옵니다
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
      throw new Error('Failed to fetch standings data');
    }

    const standingsData = await standingsResponse.json();
    
    // 원본 URL 유지
    const formattedStandings = standingsData.response[0]?.league?.standings || [];

    // 응답 데이터 구조화 - 클라이언트 컴포넌트에서 쉽게 사용할 수 있도록 수정
    const formattedData = {
      standings: {
        league: {
          id: leagueId,
          name: matchDetails.league?.name,
          country: matchDetails.league?.country,
          logo: matchDetails.league?.logo,
          flag: matchDetails.league?.flag,
          season: season,
          standings: formattedStandings
        }
      },
      // 홈/어웨이 팀 정보를 최상위 레벨로 이동
      home: homeTeam ? {
        id: homeTeam.id,
        name: homeTeam.name,
        logo: homeTeam.logo
      } : null,
      away: awayTeam ? {
        id: awayTeam.id,
        name: awayTeam.name,
        logo: awayTeam.logo
      } : null
    };

    return NextResponse.json(formattedData);
    
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings data', details: (error as Error).message }, 
      { status: 500 }
    );
  }
} 
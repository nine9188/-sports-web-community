import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '';
    
    // 선수 통계 정보를 가져오는 API 호출
    let apiUrl = `https://v3.football.api-sports.io/players?id=${id}`;
    if (season) {
      apiUrl += `&season=${season}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ message: '선수 데이터가 없습니다.' }, { status: 404 });
    }

    // 선수 통계 정보 추출
    const playerStats = data.response[0].statistics;
    
    if (!playerStats || playerStats.length === 0) {
      return NextResponse.json({ message: '해당 시즌에 대한 통계 데이터가 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ statistics: playerStats });
    
  } catch (error) {
    console.error('선수 통계 API 오류:', error);
    return NextResponse.json(
      { 
        error: '선수 통계 데이터를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 
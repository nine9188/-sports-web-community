import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    console.log(`Fetching player seasons for ID: ${id}`);

    // 선수의 모든 시즌 정보를 가져오는 API 호출
    const response = await fetch(`https://v3.football.api-sports.io/players/seasons?player=${id}`, {
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
      return NextResponse.json({ seasons: [] }, { status: 404 });
    }

    // 현재 시즌을 올바르게 처리
    // 현재 연도가 2024년이면 2024/2025 시즌은 API에서 2024로 표기됨
    const currentYear = new Date().getFullYear();
    let seasons = data.response;
    
    // 시즌 목록에 현재 연도가 없으면 추가 (API가 최신 시즌을 아직 업데이트하지 않았을 수 있음)
    if (!seasons.includes(currentYear)) {
      seasons = [currentYear, ...seasons];
    }

    return NextResponse.json({ seasons: seasons });
    
  } catch (error) {
    console.error('선수 시즌 API 오류:', error);
    return NextResponse.json(
      { 
        error: '선수 시즌 데이터를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 
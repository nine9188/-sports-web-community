import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const season = currentMonth < 7 ? currentYear - 1 : currentYear;
    
    // 최근 10경기와 다음 5경기를 병렬로 가져오기
    const [lastMatchesResponse, nextMatchesResponse] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?team=${id}&season=${season}&last=10`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?team=${id}&next=5`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      })
    ]);
    
    if (!lastMatchesResponse.ok || !nextMatchesResponse.ok) {
      throw new Error('경기 정보를 가져오는데 실패했습니다');
    }
    
    const lastMatches = await lastMatchesResponse.json();
    const nextMatches = await nextMatchesResponse.json();
    
    // 두 결과 합치기
    const matches = [
      ...nextMatches.response,
      ...lastMatches.response
    ];

    return NextResponse.json(matches);

  } catch (error) {
    console.error('Matches fetch error:', error);
    return NextResponse.json(
      { error: '경기 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
} 
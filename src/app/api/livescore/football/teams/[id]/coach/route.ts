import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(
      `https://v3.football.api-sports.io/coachs?team=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'  // Next.js의 Route Cache 활용
      }
    );

    if (!response.ok) {
      throw new Error('감독 정보를 가져오는데 실패했습니다');
    }

    const data = await response.json();
    const coach = data.response[0] || null;

    // 필요한 정보만 추출
    const coachInfo = coach ? {
      id: coach.id,
      name: coach.name,
      firstName: coach.firstname,
      lastName: coach.lastname,
      age: coach.age,
      nationality: coach.nationality,
      photo: coach.photo,
      career: coach.career,
      team: coach.team,
    } : null;

    return NextResponse.json(coachInfo);

  } catch (error) {
    console.error('Coach fetch error:', error);
    return NextResponse.json(
      { error: '감독 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
} 
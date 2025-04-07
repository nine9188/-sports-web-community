import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/statistics?fixture=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch statistics data');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch statistics data' }, 
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    const events = Array.isArray(data.response) ? data.response : [];
    
    return NextResponse.json({ 
      events,
      status: 'success',
      message: events.length ? 'Events found' : 'No events found'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        events: [],
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { fetchStandingsData } from '@/domains/sidebar/actions/football';

const ALLOWED_LEAGUES = new Set(['premier', 'laliga', 'bundesliga', 'serieA', 'ligue1']);

export async function GET(
  _request: Request,
  context: { params: Promise<{ league: string }> }
) {
  const { league } = await context.params;

  if (!ALLOWED_LEAGUES.has(league)) {
    return NextResponse.json({ error: 'Invalid league' }, { status: 400 });
  }

  const data = await fetchStandingsData(league);

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=1800',
      },
    }
  );
}

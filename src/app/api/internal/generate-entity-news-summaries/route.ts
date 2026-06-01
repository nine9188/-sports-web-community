import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/client.server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type SummaryModule = {
  generateEntityNewsSummary: (
    supabase: ReturnType<typeof getSupabaseAdmin>,
    options: { entityId: number; limit?: number; apply?: boolean; model?: string }
  ) => Promise<unknown>;
};

function isAuthorized(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function parseTeamIds(request: Request): number[] {
  const url = new URL(request.url);
  const queryTeamIds = url.searchParams.get('teamIds');
  const envTeamIds = process.env.ENTITY_SUMMARY_TEAM_IDS || '42';
  const raw = queryTeamIds || envTeamIds;

  return [...new Set(raw
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isFinite(value) && value > 0))]
    .slice(0, 20);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamIds = parseTeamIds(request);
  if (teamIds.length === 0) {
    return NextResponse.json({ error: 'No valid team IDs' }, { status: 400 });
  }

  const limit = Number(new URL(request.url).searchParams.get('limit') || 8);
  const supabase = getSupabaseAdmin();
  const { generateEntityNewsSummary } = await import('../../../../../scripts/generate-entity-news-summaries.cjs') as SummaryModule;

  const results: Record<number, unknown> = {};
  for (const teamId of teamIds) {
    try {
      results[teamId] = await generateEntityNewsSummary(supabase, {
        entityId: teamId,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 8,
        apply: true,
      });
    } catch (error) {
      results[teamId] = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return NextResponse.json({
    ok: true,
    teamIds,
    results,
  });
}

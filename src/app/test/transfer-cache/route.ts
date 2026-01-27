import { fetchTeamTransfers } from '@/domains/livescore/actions/transfers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const teamId = 33; // Manchester United
  const startTime = Date.now();

  const data = await fetchTeamTransfers(teamId);

  const elapsed = Date.now() - startTime;

  // Supabase 캐시 확인
  const supabase = getSupabaseAdmin();
  const { data: cacheRows } = await supabase
    .from('team_cache')
    .select('team_id, data_type, season, updated_at')
    .eq('team_id', teamId)
    .eq('data_type', 'transfers')
    .order('updated_at', { ascending: false });

  return NextResponse.json({
    elapsed_ms: elapsed,
    has_data: !!data,
    transfers_in_count: data?.transfers.in.length ?? 0,
    transfers_out_count: data?.transfers.out.length ?? 0,
    cache_rows: cacheRows,
    data_size_bytes: JSON.stringify(data).length,
  });
}

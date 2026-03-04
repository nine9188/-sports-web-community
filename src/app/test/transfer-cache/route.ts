import { fetchTeamTransfers } from '@/domains/livescore/actions/transfers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const teamId = 33; // Manchester United
  const startTime = Date.now();

  const data = await fetchTeamTransfers(teamId);

  const elapsed = Date.now() - startTime;

  return NextResponse.json({
    elapsed_ms: elapsed,
    has_data: !!data,
    transfers_in_count: data?.transfers.in.length ?? 0,
    transfers_out_count: data?.transfers.out.length ?? 0,
    data_size_bytes: JSON.stringify(data).length,
  });
}

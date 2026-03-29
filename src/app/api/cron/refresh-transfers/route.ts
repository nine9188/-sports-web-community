import { NextRequest, NextResponse } from 'next/server';
import { refreshLeagueTransferCache } from '@/domains/livescore/actions/transfers/refreshTransferCache';

// Tier 1~3 리그 목록
const CACHED_LEAGUES = [
  39, 140, 135, 78, 61,     // Tier 1: 5대 리그
  292, 40, 88, 94,           // Tier 2: K리그, 챔피언십, 에레디비시, 포르투갈리가
  98, 253, 307, 71,          // Tier 3: J리그, MLS, 사우디, 브라질레이랑
];

/**
 * 이적 캐시 갱신 API
 *
 * 사용법:
 * - GET /api/cron/refresh-transfers          → 전체 리그 순차 갱신 (13개 리그, 리그별 요청)
 * - GET /api/cron/refresh-transfers?league=39 → 특정 리그만 갱신
 *
 * Vercel Cron: 매주 월요일 03:00 UTC
 */
export async function GET(request: NextRequest) {
  // 인증 검증
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 프로덕션에서만 인증 검증 (로컬 dev에서는 스킵)
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leagueParam = request.nextUrl.searchParams.get('league');

  // 특정 리그만 갱신
  if (leagueParam) {
    const leagueId = parseInt(leagueParam);
    if (isNaN(leagueId)) {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 });
    }

    const result = await refreshLeagueTransferCache(leagueId);
    return NextResponse.json(result);
  }

  // 전체 리그 갱신: 리그별로 자기 자신을 호출 (각 요청이 독립적으로 타임아웃 관리)
  const baseUrl = request.nextUrl.origin;
  const results = [];

  for (const leagueId of CACHED_LEAGUES) {
    try {
      const res = await fetch(`${baseUrl}/api/cron/refresh-transfers?league=${leagueId}`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
        cache: 'no-store',
      });

      const data = await res.json();
      results.push(data);

      console.log(`[Cron] 리그 ${leagueId} 완료:`, data.transfers, '건');

      // 리그 간 3초 대기 (rate limit 여유)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      results.push({ leagueId, success: false, error: String(error) });
    }
  }

  const totalTransfers = results.reduce((sum, r) => sum + (r.transfers || 0), 0);

  return NextResponse.json({
    success: true,
    message: `${CACHED_LEAGUES.length}개 리그 갱신 완료: ${totalTransfers}건`,
    results,
  });
}

// hobby 플랜 최대 60초
export const maxDuration = 60;

'use server';

import { unstable_cache, revalidateTag } from 'next/cache';
import { after } from 'next/server';

/**
 * 경기 데이터 Cloudflare KV 캐시 헬퍼
 *
 * 저장소: Cloudflare Worker (match-cache-prod) + KV
 * - 엔드포인트: process.env.MATCH_CACHE_URL
 * - 쓰기 인증: process.env.MATCH_CACHE_WRITE_SECRET (X-Write-Secret 헤더)
 *
 * 종료 경기(FT/AET/PEN) 데이터만 캐시. 불변 데이터 → 30일 TTL.
 * Next.js 레이어에도 unstable_cache 7일 래핑 (반복 요청 시 Worker 호출 0회).
 */

type MatchDataType = 'full' | 'matchPlayerStats' | 'power';

function getWorkerUrl(): string {
  const url = process.env.MATCH_CACHE_URL;
  if (!url) throw new Error('MATCH_CACHE_URL env var not set');
  return url.replace(/\/$/, '');
}

function getWriteSecret(): string {
  const secret = process.env.MATCH_CACHE_WRITE_SECRET;
  if (!secret) throw new Error('MATCH_CACHE_WRITE_SECRET env var not set');
  return secret;
}

/**
 * Worker에서 캐시 읽기 (Next.js unstable_cache 7일 래핑)
 *
 * 동일 요청 내 여러 번 호출돼도 Worker는 1회만 호출됨.
 * setMatchCache가 저장 성공 시 revalidateTag로 즉시 무효화.
 */
const _getMatchCacheImpl = (matchId: number, dataType: MatchDataType) => unstable_cache(
  async (): Promise<unknown | null> => {
    try {
      const res = await fetch(`${getWorkerUrl()}/match/${matchId}/${dataType}`, {
        method: 'GET',
        // Worker 자체 응답도 짧게 edge 캐시 (CDN 레이어)
        next: { revalidate: 86400, tags: [`match-${matchId}`] },
      });

      if (!res.ok) return null;

      const body = await res.json() as { hit: boolean; data: unknown };
      return body.hit ? body.data : null;
    } catch {
      return null;
    }
  },
  ['match-cache', String(matchId), dataType],
  { revalidate: 604800, tags: ['match-cache', `match-${matchId}`] }
)();

export async function getMatchCache(
  matchId: number,
  dataType: MatchDataType
): Promise<unknown | null> {
  return _getMatchCacheImpl(matchId, dataType);
}

/**
 * 여러 데이터 타입을 한번에 읽기 — 병렬 Worker 호출
 */
export async function getMatchCacheBulk(
  matchId: number,
  dataTypes: MatchDataType[]
): Promise<Record<string, unknown>> {
  try {
    const entries = await Promise.all(
      dataTypes.map(async (dt) => [dt, await getMatchCache(matchId, dt)] as const)
    );

    const result: Record<string, unknown> = {};
    for (const [dt, data] of entries) {
      if (data !== null) {
        result[dt] = data;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 캐시에 데이터 저장 — 종료 경기만
 *
 * Worker가 서버 측에서 다시 검증:
 * - 허용 리그 화이트리스트
 * - is_complete 판정
 *
 * 실패는 무시 (fire-and-forget).
 */
export async function setMatchCache(
  matchId: number,
  dataType: MatchDataType,
  data: unknown,
  matchStatus: string = 'FT',
  leagueId?: number | null
): Promise<void> {
  try {
    if (!data || typeof data !== 'object') return;

    const res = await fetch(`${getWorkerUrl()}/match/${matchId}/${dataType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Write-Secret': getWriteSecret(),
      },
      body: JSON.stringify({ data, matchStatus, leagueId: leagueId ?? null }),
    });

    if (!res.ok) return;

    // Next.js 캐시 무효화 (진행 중 → 종료 전환 시 즉시 반영)
    after(() => {
      revalidateTag(`match-${matchId}`);
    });
  } catch {
    // 저장 실패는 무시
  }
}

// ── 관리 함수 ──

/**
 * 특정 경기의 캐시 삭제 (관리자용)
 */
export async function deleteMatchCache(
  matchId: number,
  dataType?: MatchDataType
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = dataType
      ? `/match/${matchId}/${dataType}`
      : `/match/${matchId}`;

    const res = await fetch(`${getWorkerUrl()}${path}`, {
      method: 'DELETE',
      headers: { 'X-Write-Secret': getWriteSecret() },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, error: `Worker returned ${res.status}: ${text}` };
    }

    revalidateTag(`match-${matchId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

/**
 * 캐시 통계 조회 (관리자 대시보드용)
 * Worker /stats 엔드포인트 호출
 */
export async function getMatchCacheStats(): Promise<{
  totalEntries: number;
  completeEntries: number;
  incompleteEntries: number;
  byDataType: Record<string, number>;
}> {
  try {
    const res = await fetch(`${getWorkerUrl()}/stats`, {
      method: 'GET',
      headers: { 'X-Write-Secret': getWriteSecret() },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { totalEntries: 0, completeEntries: 0, incompleteEntries: 0, byDataType: {} };
    }

    return await res.json() as {
      totalEntries: number;
      completeEntries: number;
      incompleteEntries: number;
      byDataType: Record<string, number>;
    };
  } catch {
    return { totalEntries: 0, completeEntries: 0, incompleteEntries: 0, byDataType: {} };
  }
}

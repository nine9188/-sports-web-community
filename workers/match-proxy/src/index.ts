/// <reference types="@cloudflare/workers-types" />

/**
 * Match Cache Worker
 *
 * 엔드포인트:
 *   GET  /match/:id/:dataType          → KV 캐시 조회 (없으면 null)
 *   POST /match/:id/:dataType          → KV 저장 (body: JSON 데이터)
 *   DELETE /match/:id[?dataType=...]   → 캐시 삭제
 *
 * KV key format: "match:{matchId}:{dataType}"
 * 저장 형식: { data, match_status, is_complete, updated_at }
 */

export interface Env {
  MATCH_CACHE: KVNamespace;
  ASSET_CACHE: KVNamespace;
  ALLOWED_ORIGINS: string;
  CACHE_TTL_SECONDS: string;
  WRITE_SECRET: string;           // POST/DELETE 인증용 (wrangler secret put WRITE_SECRET)
}

type AssetType = 'player_photo' | 'coach_photo' | 'team_logo' | 'league_logo' | 'venue_photo';
const VALID_ASSET_TYPES: AssetType[] = ['player_photo', 'coach_photo', 'team_logo', 'league_logo', 'venue_photo'];

function assetKey(type: string, entityId: number | string): string {
  return `asset:${type}:${entityId}`;
}

type MatchDataType = 'full' | 'matchPlayerStats' | 'power';

const VALID_DATA_TYPES: MatchDataType[] = ['full', 'matchPlayerStats', 'power'];

/**
 * 저장 허용 리그 ID: 주요 13개 + 컵 7개 = 20개
 * 기존 Supabase matchCache.ts와 동일 기준 유지
 */
const ALLOWED_LEAGUE_IDS = new Set<number>([
  39, 140, 78, 135, 61,          // 유럽 5대
  88, 94, 119,                   // 유럽 기타
  292, 293, 98, 307, 253,        // 아시아/미주
  2, 3, 848, 531, 5, 45, 48,     // 컵 7개
]);

interface CacheEntry {
  data: unknown;
  match_status: string;
  is_complete: boolean;
  updated_at: string;
}

/**
 * 캐시 저장 전 유효성 검증
 * 완전한 데이터만 is_complete=true로 저장
 */
function validateCacheData(dataType: MatchDataType, data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  switch (dataType) {
    case 'full': {
      if (!d.success || !d.match) return false;
      const lineups = d.lineups as Record<string, unknown> | undefined;
      if (!lineups?.response) return false;
      if (!Array.isArray(d.events) || d.events.length === 0) return false;
      if (!Array.isArray(d.stats) || d.stats.length === 0) return false;
      return true;
    }
    case 'matchPlayerStats': {
      if (!d.success) return false;
      if (!Array.isArray(d.allPlayersData) || d.allPlayersData.length === 0) return false;
      if (!d.ratings || typeof d.ratings !== 'object') return false;
      return true;
    }
    case 'power': {
      if (!d.h2h || typeof d.h2h !== 'object') return false;
      if (!d.recent || typeof d.recent !== 'object') return false;
      const recent = d.recent as Record<string, unknown>;
      if (!recent.teamA || !recent.teamB) return false;
      return true;
    }
  }
}

/**
 * data에서 league.id 추출 (full은 match.league.id, 나머지는 league.id 또는 null)
 */
function extractLeagueIdFromData(dataType: MatchDataType, data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  if (dataType === 'full') {
    const match = d.match as Record<string, unknown> | undefined;
    const league = match?.league as Record<string, unknown> | undefined;
    const id = league?.id;
    return typeof id === 'number' ? id : null;
  }

  const league = d.league as Record<string, unknown> | undefined;
  const id = league?.id;
  return typeof id === 'number' ? id : null;
}

function kvKey(matchId: string, dataType: string): string {
  return `match:${matchId}:${dataType}`;
}

function corsHeaders(origin: string | null, allowed: string): HeadersInit {
  const allowedList = allowed.split(',').map(s => s.trim());
  const ok = origin && allowedList.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin! : allowedList[0],
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Write-Secret',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

function isAuthorized(req: Request, env: Env): boolean {
  if (!env.WRITE_SECRET) return false;
  const header = req.headers.get('X-Write-Secret');
  return header === env.WRITE_SECRET;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    // Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'match-cache-prod' }, 200, cors);
    }

    // Stats (관리자용): KV list로 match:* 키 모두 카운트
    if (url.pathname === '/stats' && req.method === 'GET') {
      if (!isAuthorized(req, env)) {
        return json({ error: 'Unauthorized' }, 401, cors);
      }
      const byDataType: Record<string, number> = { full: 0, matchPlayerStats: 0, power: 0 };
      let completeEntries = 0;
      let incompleteEntries = 0;
      let cursor: string | undefined;
      let totalKeys = 0;

      do {
        const listed = await env.MATCH_CACHE.list({ prefix: 'match:', cursor, limit: 1000 });
        totalKeys += listed.keys.length;
        for (const k of listed.keys) {
          const parts = k.name.split(':'); // match:{id}:{dataType}
          const dt = parts[2];
          if (dt && dt in byDataType) byDataType[dt]++;
        }
        cursor = listed.list_complete ? undefined : listed.cursor;
      } while (cursor);

      // is_complete 카운트는 비싸서 샘플링 생략 (필요 시 별도 카운터로 구현)
      completeEntries = totalKeys;

      return json({
        totalEntries: totalKeys,
        completeEntries,
        incompleteEntries,
        byDataType,
      }, 200, cors);
    }

    // ===== ASSET CACHE ENDPOINTS =====

    // Batch check: POST /asset/check  { type, ids: number[] }
    // Returns { ready: number[] } — ready인 ID 목록만
    if (url.pathname === '/asset/check' && req.method === 'POST') {
      let body: { type: string; ids: number[] };
      try {
        body = await req.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      if (!VALID_ASSET_TYPES.includes(body.type as AssetType)) {
        return json({ error: 'Invalid type' }, 400, cors);
      }
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return json({ ready: [] }, 200, cors);
      }

      // 각 ID를 KV에서 병렬 조회
      const checks = await Promise.all(
        body.ids.map(async (id) => {
          const val = await env.ASSET_CACHE.get(assetKey(body.type, id));
          return { id, ready: val === 'ready' };
        })
      );
      const ready = checks.filter(c => c.ready).map(c => c.id);
      return json({ ready }, 200, cors);
    }

    // Asset type의 전체 ready ID 조회: GET /asset/ready/:type (관리자 전용 — list 비용 높음)
    if (url.pathname.startsWith('/asset/ready/') && req.method === 'GET') {
      if (!isAuthorized(req, env)) {
        return json({ error: 'Unauthorized — this endpoint uses KV list (expensive)' }, 401, cors);
      }
      const type = url.pathname.slice('/asset/ready/'.length);
      if (!VALID_ASSET_TYPES.includes(type as AssetType)) {
        return json({ error: 'Invalid type' }, 400, cors);
      }

      const ids: number[] = [];
      let cursor: string | undefined;
      do {
        const listed = await env.ASSET_CACHE.list({ prefix: `asset:${type}:`, cursor, limit: 1000 });
        for (const k of listed.keys) {
          const parts = k.name.split(':');
          const id = parseInt(parts[2], 10);
          if (!isNaN(id)) ids.push(id);
        }
        cursor = listed.list_complete ? undefined : listed.cursor;
      } while (cursor);

      return json({ type, ids, count: ids.length }, 200, cors);
    }

    // 단일 asset 저장: POST /asset/:type/:id
    const assetSingleMatch = url.pathname.match(/^\/asset\/([a-z_]+)\/(\d+)$/);
    if (assetSingleMatch) {
      const type = assetSingleMatch[1];
      const entityId = assetSingleMatch[2];

      if (!VALID_ASSET_TYPES.includes(type as AssetType)) {
        return json({ error: 'Invalid type' }, 400, cors);
      }

      if (req.method === 'POST') {
        if (!isAuthorized(req, env)) {
          return json({ error: 'Unauthorized' }, 401, cors);
        }
        // 영구 저장 (TTL 없음 — ready 상태는 거의 불변)
        await env.ASSET_CACHE.put(assetKey(type, entityId), 'ready');
        return json({ saved: true }, 200, cors);
      }

      if (req.method === 'DELETE') {
        if (!isAuthorized(req, env)) {
          return json({ error: 'Unauthorized' }, 401, cors);
        }
        await env.ASSET_CACHE.delete(assetKey(type, entityId));
        return json({ deleted: true }, 200, cors);
      }

      if (req.method === 'GET') {
        const val = await env.ASSET_CACHE.get(assetKey(type, entityId));
        return json({ ready: val === 'ready' }, 200, cors);
      }
    }

    // Batch 저장: POST /asset/bulk  { type, ids: number[] }
    if (url.pathname === '/asset/bulk' && req.method === 'POST') {
      if (!isAuthorized(req, env)) {
        return json({ error: 'Unauthorized' }, 401, cors);
      }
      let body: { type: string; ids: number[] };
      try {
        body = await req.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      if (!VALID_ASSET_TYPES.includes(body.type as AssetType)) {
        return json({ error: 'Invalid type' }, 400, cors);
      }
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return json({ saved: 0 }, 200, cors);
      }

      // 병렬 저장 (KV는 초당 1000 write 제한 — 매우 큰 배치는 500개 단위로 끊어서 처리)
      const BATCH = 500;
      let saved = 0;
      for (let i = 0; i < body.ids.length; i += BATCH) {
        const chunk = body.ids.slice(i, i + BATCH);
        await Promise.all(chunk.map(id => env.ASSET_CACHE.put(assetKey(body.type, id), 'ready')));
        saved += chunk.length;
      }

      return json({ saved }, 200, cors);
    }

    // ===== MATCH CACHE ENDPOINTS =====

    // Route: /match/:id/:dataType
    const matchPathMatch = url.pathname.match(/^\/match\/(\d+)(?:\/([a-zA-Z]+))?$/);

    if (matchPathMatch) {
      const matchId = matchPathMatch[1];
      const dataType = matchPathMatch[2];

      // GET: 캐시 조회
      if (req.method === 'GET') {
        if (!dataType || !VALID_DATA_TYPES.includes(dataType as MatchDataType)) {
          return json({ error: 'Invalid dataType' }, 400, cors);
        }
        const raw = await env.MATCH_CACHE.get(kvKey(matchId, dataType));
        if (!raw) {
          return json({ hit: false, data: null }, 200, cors);
        }
        try {
          const entry: CacheEntry = JSON.parse(raw);
          // is_complete=false면 미스 취급
          if (!entry.is_complete) {
            return json({ hit: false, data: null, reason: 'incomplete' }, 200, cors);
          }
          return json({ hit: true, data: entry.data, match_status: entry.match_status }, 200, cors);
        } catch {
          return json({ hit: false, data: null, reason: 'parse_error' }, 200, cors);
        }
      }

      // POST: 저장 (인증 필요)
      if (req.method === 'POST') {
        if (!isAuthorized(req, env)) {
          return json({ error: 'Unauthorized' }, 401, cors);
        }
        if (!dataType || !VALID_DATA_TYPES.includes(dataType as MatchDataType)) {
          return json({ error: 'Invalid dataType' }, 400, cors);
        }
        let body: { data: unknown; matchStatus?: string; leagueId?: number | null };
        try {
          body = await req.json();
        } catch {
          return json({ error: 'Invalid JSON body' }, 400, cors);
        }
        if (!body.data || typeof body.data !== 'object') {
          return json({ error: 'Missing data' }, 400, cors);
        }

        // 리그 화이트리스트 검증
        const effectiveLeagueId = body.leagueId ?? extractLeagueIdFromData(dataType as MatchDataType, body.data);
        if (effectiveLeagueId !== null && effectiveLeagueId !== undefined && !ALLOWED_LEAGUE_IDS.has(effectiveLeagueId)) {
          return json({ skipped: true, reason: 'league_not_allowed', leagueId: effectiveLeagueId }, 200, cors);
        }

        const isComplete = validateCacheData(dataType as MatchDataType, body.data);
        const entry: CacheEntry = {
          data: body.data,
          match_status: body.matchStatus ?? 'FT',
          is_complete: isComplete,
          updated_at: new Date().toISOString(),
        };

        const ttl = parseInt(env.CACHE_TTL_SECONDS, 10) || 2592000;
        await env.MATCH_CACHE.put(kvKey(matchId, dataType), JSON.stringify(entry), {
          expirationTtl: ttl,
        });

        return json({ saved: true, is_complete: isComplete }, 200, cors);
      }

      // DELETE: 단일 삭제 (인증 필요)
      if (req.method === 'DELETE') {
        if (!isAuthorized(req, env)) {
          return json({ error: 'Unauthorized' }, 401, cors);
        }
        if (dataType) {
          await env.MATCH_CACHE.delete(kvKey(matchId, dataType));
          return json({ deleted: 1 }, 200, cors);
        }
        // 전체 삭제: 모든 dataType
        await Promise.all(VALID_DATA_TYPES.map(dt => env.MATCH_CACHE.delete(kvKey(matchId, dt))));
        return json({ deleted: VALID_DATA_TYPES.length }, 200, cors);
      }
    }

    return json({ error: 'Not found' }, 404, cors);
  },
};

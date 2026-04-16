// Backfill asset_cache (Supabase) → Cloudflare KV (ASSET_CACHE)
// Usage: node workers/match-proxy/scripts/backfill-asset-cache.mjs

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WORKER_URL = process.env.MATCH_CACHE_URL || 'https://match-cache-prod.4590football.workers.dev';
const WRITE_SECRET = process.env.MATCH_CACHE_WRITE_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY || !WRITE_SECRET) {
  console.error('ENV missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / MATCH_CACHE_WRITE_SECRET');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const ASSET_TYPES = ['player_photo', 'coach_photo', 'team_logo', 'league_logo', 'venue_photo'];
const BATCH = 500;

async function fetchAllReadyIds(type) {
  const all = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('asset_cache')
      .select('entity_id')
      .eq('type', type)
      .eq('status', 'ready')
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data.map(r => r.entity_id));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function bulkUpload(type, ids) {
  let saved = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const res = await fetch(`${WORKER_URL}/asset/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Write-Secret': WRITE_SECRET,
      },
      body: JSON.stringify({ type, ids: chunk }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Worker returned ${res.status}: ${txt}`);
    }
    const body = await res.json();
    saved += body.saved || 0;
    process.stdout.write(`\r  [${type}] ${saved}/${ids.length}`);
  }
  process.stdout.write('\n');
  return saved;
}

async function main() {
  for (const type of ASSET_TYPES) {
    console.log(`\n=== ${type} ===`);
    console.log(`  Supabase에서 ready ID 조회 중...`);
    const ids = await fetchAllReadyIds(type);
    console.log(`  총 ${ids.length}개 ready`);

    if (ids.length === 0) continue;

    console.log(`  KV에 batch upload (${BATCH}개 단위)...`);
    const saved = await bulkUpload(type, ids);
    console.log(`  ✅ ${saved}개 저장 완료`);
  }
  console.log('\n🎉 Backfill 완료');
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

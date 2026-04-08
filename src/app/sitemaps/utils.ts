import { createClient } from '@supabase/supabase-js';

// ─── Supabase 클라이언트 (쿠키 의존성 없음) ────────────────────────
export function getSitemapSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ─── 리그 매핑 ─────────────────────────────────────────────────────
export interface LeagueConfig {
  id: number;
  slug: string;
  name: string;
}

export const LEAGUES: LeagueConfig[] = [
  { id: 39, slug: 'epl', name: 'Premier League' },
  { id: 140, slug: 'laliga', name: 'La Liga' },
  { id: 78, slug: 'bundesliga', name: 'Bundesliga' },
  { id: 135, slug: 'seriea', name: 'Serie A' },
  { id: 61, slug: 'ligue1', name: 'Ligue 1' },
  { id: 88, slug: 'eredivisie', name: 'Eredivisie' },
  { id: 94, slug: 'primeira', name: 'Primeira Liga' },
  { id: 292, slug: 'kleague', name: 'K League 1' },
];

// UCL/UEL 등 대회 (매치 전용)
export const COMPETITIONS: LeagueConfig[] = [
  { id: 2, slug: 'ucl', name: 'UEFA Champions League' },
  { id: 3, slug: 'uel', name: 'UEFA Europa League' },
  { id: 848, slug: 'uecl', name: 'UEFA Conference League' },
];

export const ALL_MATCH_LEAGUES = [...LEAGUES, ...COMPETITIONS];

export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
  return ALL_MATCH_LEAGUES.find((l) => l.slug === slug);
}

export function getLeagueById(id: number): LeagueConfig | undefined {
  return ALL_MATCH_LEAGUES.find((l) => l.id === id);
}

// 팀명 → slug 변환 (사이트맵 URL용)
export function teamNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── revalidate 상수 ───────────────────────────────────────────────
export const REVALIDATE = {
  REALTIME: 600,      // 10분 - posts-recent, matches-live
  FREQUENT: 3600,     // 1시간 - matches-upcoming, posts
  STANDARD: 21600,    // 6시간 - teams, players, static
} as const;

// ─── XML 빌더 ──────────────────────────────────────────────────────
interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

// changefreq와 priority는 구글이 무시하므로 출력하지 않음
// https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
export function buildUrlsetXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((u) => {
      let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>`;
      if (u.lastmod) entry += `\n    <lastmod>${u.lastmod}</lastmod>`;
      entry += `\n  </url>`;
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export function buildSitemapIndexXml(
  sitemaps: { loc: string; lastmod?: string }[]
): string {
  const entries = sitemaps
    .map((s) => {
      let entry = `  <sitemap>\n    <loc>${escapeXml(s.loc)}</loc>`;
      if (s.lastmod) entry += `\n    <lastmod>${s.lastmod}</lastmod>`;
      entry += `\n  </sitemap>`;
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// XML 특수문자 이스케이프
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Response 헬퍼 ─────────────────────────────────────────────────
export function sitemapResponse(xml: string, maxAge: number = 3600): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`,
    },
  });
}

// ─── 페이지네이션 ──────────────────────────────────────────────────
const PAGE_SIZE = 1000;

export async function fetchAll<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const allData: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await queryFn(offset, offset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

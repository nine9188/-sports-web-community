// ─── Sitemap 공통 유틸 ───

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function query<T>(table: string, params: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toIso(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  try { return new Date(dateStr).toISOString(); } catch { return undefined; }
}

export function sitemapResponse(entries: SitemapEntry[]): Response {
  const urls = entries.map((e) => {
    let s = `<url>\n<loc>${escapeXml(e.url)}</loc>`;
    if (e.lastModified) s += `\n<lastmod>${e.lastModified}</lastmod>`;
    if (e.changeFrequency) s += `\n<changefreq>${e.changeFrequency}</changefreq>`;
    if (typeof e.priority === 'number') s += `\n<priority>${e.priority}</priority>`;
    return s + '\n</url>';
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

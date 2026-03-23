import { createClient } from '@supabase/supabase-js';

// 사이트맵 생성용 Supabase 클라이언트 (쿠키 의존성 없음)
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

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

// URL 배열을 사이트맵 XML로 변환
export function buildUrlsetXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((u) => {
      let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>`;
      if (u.lastmod) entry += `\n    <lastmod>${u.lastmod}</lastmod>`;
      if (u.changefreq) entry += `\n    <changefreq>${u.changefreq}</changefreq>`;
      if (u.priority !== undefined) entry += `\n    <priority>${u.priority}</priority>`;
      entry += `\n  </url>`;
      return entry;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// XML 특수문자 이스케이프
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 사이트맵 XML Response 생성
export function sitemapResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

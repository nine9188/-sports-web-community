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
}

// URL 배열을 사이트맵 XML로 변환
// 참고: changefreq와 priority는 구글이 무시하므로 출력하지 않음
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

// Supabase 1,000행 제한 우회: 페이지네이션으로 전체 데이터 조회
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

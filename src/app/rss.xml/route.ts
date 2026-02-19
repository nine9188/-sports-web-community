import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  // HTML 태그 제거
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const seoSettings = await getSeoSettings();
    const baseUrl = seoSettings?.site_url || siteConfig.url;
    const siteName = seoSettings?.site_name || siteConfig.name;
    const siteDescription = seoSettings?.default_description || siteConfig.description;

    // 최근 게시글 100개 가져오기 (삭제되지 않은 게시글만)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        content,
        created_at,
        updated_at,
        board:boards!inner(slug, name)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('RSS 피드 생성 실패:', error);
      return new Response('RSS 피드를 생성할 수 없습니다.', { status: 500 });
    }

    // RSS XML 생성
    const rssItems = posts
      ?.filter((post) => post.board && typeof post.board === 'object' && 'slug' in post.board)
      .map((post) => {
        const board = post.board as { slug: string; name: string };
        const postUrl = `${baseUrl}/boards/${board.slug}/${post.post_number}`;
        const pubDate = new Date(post.created_at || new Date()).toUTCString();

        // content에서 HTML 제거 및 요약 생성 (최대 300자)
        const contentStr = typeof post.content === 'string'
          ? post.content
          : JSON.stringify(post.content || '');
        const plainContent = stripHtml(contentStr);
        const description = plainContent.length > 300
          ? plainContent.substring(0, 300) + '...'
          : plainContent;

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(board.name)}</category>
    </item>`;
      })
      .join('') || '';

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />${rssItems}
  </channel>
</rss>`;

    return new Response(rssFeed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('RSS 피드 생성 중 오류:', error);
    return new Response('RSS 피드를 생성할 수 없습니다.', { status: 500 });
  }
}

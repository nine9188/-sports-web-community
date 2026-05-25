import type { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { siteUrl } from '@/shared/seo/sitemap';
import { sitemapUrlsetXml } from '@/shared/seo/sitemapXml';

export const revalidate = 300;

type RecentPostRow = {
  post_number: number;
  updated_at: string | null;
  created_at: string | null;
  boards: { slug: string | null } | { slug: string | null }[] | null;
};

function boardSlugFromPost(post: RecentPostRow): string | null {
  if (Array.isArray(post.boards)) return post.boards[0]?.slug ?? null;
  return post.boards?.slug ?? null;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('post_number, updated_at, created_at, boards!inner(slug)')
    .eq('is_deleted', false)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('[recent-posts-sitemap] posts query failed:', error);
    return new Response('Recent posts sitemap is temporarily unavailable.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const entries = ((data || []) as unknown as RecentPostRow[])
    .map((post): MetadataRoute.Sitemap[number] | null => {
      const boardSlug = boardSlugFromPost(post);
      if (!boardSlug) return null;

      return {
        url: siteUrl(`/boards/${boardSlug}/${post.post_number}`),
        lastModified: post.updated_at || post.created_at || undefined,
        changeFrequency: 'hourly',
        priority: 0.6,
      };
    })
    .filter((entry): entry is MetadataRoute.Sitemap[number] => Boolean(entry));

  return new Response(sitemapUrlsetXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

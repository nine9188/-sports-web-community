import { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seoSettings = await getSeoSettings();
  const baseUrl = seoSettings?.site_url || siteConfig.url;

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/boards/all`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/boards/popular`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/livescore/football`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/livescore/football/leagues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/transfers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 동적 페이지 - 게시판 목록
  const supabase = await getSupabaseServer();

  let boardPages: MetadataRoute.Sitemap = [];
  let postPages: MetadataRoute.Sitemap = [];

  try {
    // 게시판 목록 가져오기
    const { data: boards } = await supabase
      .from('boards')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (boards) {
      boardPages = boards.map((board) => ({
        url: `${baseUrl}/boards/${board.slug}`,
        lastModified: new Date(board.updated_at || new Date()),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      }));
    }

    // 최근 게시글 가져오기 (최대 1000개)
    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, updated_at, board:boards!inner(slug)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (posts) {
      postPages = posts
        .filter((post) => post.board && typeof post.board === 'object' && 'slug' in post.board)
        .map((post) => ({
          url: `${baseUrl}/boards/${(post.board as { slug: string }).slug}/${post.post_number}`,
          lastModified: new Date(post.updated_at || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    // 에러 발생 시 정적 페이지만 반환
  }

  return [...staticPages, ...boardPages, ...postPages];
}

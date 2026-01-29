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
    // 핫딜 게시판들
    {
      url: `${baseUrl}/boards/hotdeal`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/boards/hotdeal-food`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-beauty`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-mobile`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-sale`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-appliance`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-apptech`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/boards/hotdeal-living`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    // 라이브스코어
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
    // 이적시장
    {
      url: `${baseUrl}/transfers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // 샵
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    // 검색
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.4,
    },
    // 약관
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

  // 동적 페이지
  const supabase = await getSupabaseServer();

  let boardPages: MetadataRoute.Sitemap = [];
  let postPages: MetadataRoute.Sitemap = [];
  let shopCategoryPages: MetadataRoute.Sitemap = [];
  let leaguePages: MetadataRoute.Sitemap = [];
  let teamPages: MetadataRoute.Sitemap = [];

  try {
    // 게시판 목록 가져오기 (slug가 있는 것만)
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null);

    if (boards) {
      boardPages = boards
        .filter((board) => board.slug)
        .map((board) => ({
          url: `${baseUrl}/boards/${board.slug}`,
          lastModified: new Date(),
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

    // 샵 카테고리 가져오기
    const { data: shopCategories } = await supabase
      .from('shop_categories')
      .select('slug')
      .eq('is_active', true);

    if (shopCategories) {
      shopCategoryPages = shopCategories.map((category) => ({
        url: `${baseUrl}/shop/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
    }

    // 주요 리그 페이지 가져오기 (상위 20개 리그)
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id')
      .order('id', { ascending: true })
      .limit(20);

    if (leagues) {
      leaguePages = leagues.map((league) => ({
        url: `${baseUrl}/livescore/football/leagues/${league.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.65,
      }));
    }

    // 인기 팀 페이지 가져오기 (로고가 있고 활성화된 팀 상위 100개)
    const { data: teams } = await supabase
      .from('football_teams')
      .select('id')
      .eq('is_active', true)
      .not('logo_url', 'is', null)
      .order('popularity_score', { ascending: false, nullsFirst: false })
      .limit(100);

    if (teams) {
      teamPages = teams.map((team) => ({
        url: `${baseUrl}/livescore/football/team/${team.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    // 에러 발생 시 정적 페이지만 반환
    console.error('Sitemap generation error:', error);
  }

  return [...staticPages, ...boardPages, ...postPages, ...shopCategoryPages, ...leaguePages, ...teamPages];
}

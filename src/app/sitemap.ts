import { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { siteConfig } from '@/shared/config';

export const revalidate = 3600; // 1시간마다 재생성

// 사이트맵 인덱스: 5개의 하위 사이트맵을 가리킴
// id 0: static (정적 + 게시판 + 리그 + 샵)
// id 1: posts (게시글 전체)
// id 2: matches (매치 최근 3개월)
// id 3: teams (팀 전체)
// id 4: players (선수 전체)
export async function generateSitemaps() {
  return [
    { id: 0 },
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const supabase = await getSupabaseServer();

  switch (id) {
    case 0:
      return generateStaticSitemap(baseUrl, supabase);
    case 1:
      return generatePostsSitemap(baseUrl, supabase);
    case 2:
      return generateMatchesSitemap(baseUrl, supabase);
    case 3:
      return generateTeamsSitemap(baseUrl, supabase);
    case 4:
      return generatePlayersSitemap(baseUrl, supabase);
    default:
      return [];
  }
}

// ============================================
// 0: 정적 페이지 + 게시판 + 리그 + 샵 카테고리
// ============================================
async function generateStaticSitemap(
  baseUrl: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/boards/all`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/boards/popular`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/boards/hotdeal`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.85 },
    { url: `${baseUrl}/boards/hotdeal-food`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-beauty`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-mobile`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-sale`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-appliance`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-apptech`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/boards/hotdeal-living`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/livescore/football`, lastModified: new Date(), changeFrequency: 'always', priority: 0.8 },
    { url: `${baseUrl}/livescore/football/leagues`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/transfers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    // 게시판 목록
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null);

    if (boards) {
      const boardPages = boards
        .filter((b) => b.slug)
        .map((b) => ({
          url: `${baseUrl}/boards/${b.slug}`,
          lastModified: new Date(),
          changeFrequency: 'hourly' as const,
          priority: 0.8,
        }));
      staticPages.push(...boardPages);
    }

    // 리그 상세
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id')
      .order('id', { ascending: true });

    if (leagues) {
      const leaguePages = leagues.map((l) => ({
        url: `${baseUrl}/livescore/football/leagues/${l.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.65,
      }));
      staticPages.push(...leaguePages);
    }

    // 샵 카테고리
    const { data: shopCategories } = await supabase
      .from('shop_categories')
      .select('slug')
      .eq('is_active', true);

    if (shopCategories) {
      const shopPages = shopCategories.map((c) => ({
        url: `${baseUrl}/shop/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
      staticPages.push(...shopPages);
    }
  } catch (error) {
    console.error('Static sitemap error:', error);
  }

  return staticPages;
}

// ============================================
// 1: 게시글 전체
// ============================================
async function generatePostsSitemap(
  baseUrl: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, updated_at, board:boards!inner(slug)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (!posts) return [];

    return posts
      .filter((p) => p.board && typeof p.board === 'object' && 'slug' in p.board)
      .map((p) => ({
        url: `${baseUrl}/boards/${(p.board as { slug: string }).slug}/${p.post_number}`,
        lastModified: new Date(p.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
  } catch (error) {
    console.error('Posts sitemap error:', error);
    return [];
  }
}

// ============================================
// 2: 매치 최근 3개월
// ============================================
async function generateMatchesSitemap(
  baseUrl: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<MetadataRoute.Sitemap> {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: matches } = await supabase
      .from('match_cache')
      .select('match_id, updated_at')
      .eq('data_type', 'full')
      .gte('updated_at', threeMonthsAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (!matches) return [];

    return matches.map((m) => ({
      url: `${baseUrl}/livescore/football/match/${m.match_id}`,
      lastModified: new Date(m.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error('Matches sitemap error:', error);
    return [];
  }
}

// ============================================
// 3: 팀 전체
// ============================================
async function generateTeamsSitemap(
  baseUrl: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: teams } = await supabase
      .from('football_teams')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (!teams) return [];

    return teams.map((t) => ({
      url: `${baseUrl}/livescore/football/team/${t.id}`,
      lastModified: new Date(t.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Teams sitemap error:', error);
    return [];
  }
}

// ============================================
// 4: 선수 전체
// ============================================
async function generatePlayersSitemap(
  baseUrl: string,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: players } = await supabase
      .from('football_players')
      .select('id, updated_at')
      .order('id', { ascending: true });

    if (!players) return [];

    return players.map((p) => ({
      url: `${baseUrl}/livescore/football/player/${p.id}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error('Players sitemap error:', error);
    return [];
  }
}

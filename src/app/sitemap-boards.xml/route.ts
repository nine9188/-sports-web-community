import { siteConfig } from '@/shared/config';
import { query, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const boards = await query<{ slug: string; team_id: number | null }>(
    'boards',
    'select=slug,team_id&slug=not.is.null'
  );

  return sitemapResponse(
    boards
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${baseUrl}/boards/${b.slug}`,
        changeFrequency: 'daily',
        priority: b.team_id ? 0.6 : 0.7,
      }))
  );
}

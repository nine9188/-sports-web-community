import { NextResponse } from 'next/server';
import {
  MAIN_SITEMAP_SECTIONS,
  buildMainSitemapIndexXml,
  getSitemapSectionCounts,
} from '@/shared/seo/sitemapIndex';

export const maxDuration = 60;

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const indexXml = buildMainSitemapIndexXml();
  const sectionCounts = await getSitemapSectionCounts();

  return NextResponse.json({
    ok: true,
    mode: 'sitemap-index',
    snapshot: false,
    sections: MAIN_SITEMAP_SECTIONS.map((section) => ({
      ...section,
      urlCount: sectionCounts[section.key],
    })),
    indexLocCount: (indexXml.match(/<loc>/g) || []).length,
    durationMs: Date.now() - startedAt,
  });
}

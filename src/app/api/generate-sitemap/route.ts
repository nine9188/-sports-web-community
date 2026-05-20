import { NextResponse } from 'next/server';
import { buildMainSitemapXml } from '@/shared/seo/sitemapIndex';
import { saveMainSitemapSnapshot } from '@/shared/seo/sitemapSnapshot';

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
  const xml = await buildMainSitemapXml();
  const snapshot = await saveMainSitemapSnapshot(xml);

  return NextResponse.json({
    ok: true,
    key: snapshot.key,
    urlCount: snapshot.url_count,
    generatedAt: snapshot.generated_at,
    durationMs: Date.now() - startedAt,
  });
}

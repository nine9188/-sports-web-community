import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

export const MAIN_SITEMAP_SNAPSHOT_KEY = 'main';
export const MIN_MAIN_SITEMAP_URLS = 1000;

type SitemapSnapshotRow = {
  key: string;
  xml: string;
  url_count: number;
  generated_at: string;
};

export function countSitemapLocs(xml: string): number {
  return (xml.match(/<loc>/g) || []).length;
}

export function assertCompleteMainSitemap(xml: string): number {
  const urlCount = countSitemapLocs(xml);

  if (urlCount < MIN_MAIN_SITEMAP_URLS) {
    throw new Error(`Main sitemap generated only ${urlCount} URLs; refusing to serve a partial sitemap.`);
  }

  return urlCount;
}

export async function getMainSitemapSnapshot(): Promise<SitemapSnapshotRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sitemap_snapshots')
    .select('key, xml, url_count, generated_at')
    .eq('key', MAIN_SITEMAP_SNAPSHOT_KEY)
    .maybeSingle();

  if (error) {
    console.error('[sitemap] snapshot query failed:', error);
    throw new Error('Failed to load sitemap snapshot.');
  }

  return data as SitemapSnapshotRow | null;
}

export async function saveMainSitemapSnapshot(xml: string): Promise<SitemapSnapshotRow> {
  const urlCount = assertCompleteMainSitemap(xml);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sitemap_snapshots')
    .upsert({
      key: MAIN_SITEMAP_SNAPSHOT_KEY,
      xml,
      url_count: urlCount,
      generated_at: now,
      updated_at: now,
    }, { onConflict: 'key' })
    .select('key, xml, url_count, generated_at')
    .single();

  if (error) {
    console.error('[sitemap] snapshot save failed:', error);
    throw new Error('Failed to save sitemap snapshot.');
  }

  return data as SitemapSnapshotRow;
}

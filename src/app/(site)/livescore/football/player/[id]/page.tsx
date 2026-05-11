import { notFound, permanentRedirect } from 'next/navigation';
import { resolvePlayerCanonicalSlug } from '@/domains/livescore/actions/player/slug';

/**
 * /player/[id] → /player/[id]/[slug] 리다이렉트 전용
 * Supabase REST API로 slug 조회 (서버 액션 import 없이 경량화)
 */
export default async function PlayerRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const slug = await resolvePlayerCanonicalSlug(id);

  if (!slug) {
    notFound();
  }

  const tabParam = tab ? `?tab=${tab}` : '';
  permanentRedirect(`/livescore/football/player/${id}/${encodeURIComponent(slug)}${tabParam}`);
}

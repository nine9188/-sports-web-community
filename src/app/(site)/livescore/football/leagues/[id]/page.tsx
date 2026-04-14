import { permanentRedirect } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';

/**
 * /leagues/[id] → /leagues/[id]/[slug] 리다이렉트 전용
 * 리그 slug는 상수 기반 (DB 호출 불필요)
 */
export default async function LeagueRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const slug = getLeagueSlug(parseInt(id, 10));

  permanentRedirect(`/livescore/football/leagues/${id}/${slug}`);
}

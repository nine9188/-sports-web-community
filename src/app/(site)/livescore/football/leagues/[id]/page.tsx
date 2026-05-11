import { permanentRedirect } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { fetchLeagueDetails } from '@/domains/livescore/actions/footballApi';

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

  const league = await fetchLeagueDetails(id);
  const slug = getLeagueSlug(parseInt(id, 10), league?.name);

  permanentRedirect(`/livescore/football/leagues/${id}/${encodeURIComponent(slug)}`);
}

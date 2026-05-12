import { permanentRedirect } from 'next/navigation';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getLeagueById } from '@/domains/livescore/actions/teamLeagueData';
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
  const leagueId = parseInt(id, 10);

  const league = await getLeagueById(leagueId);
  const leagueName = league?.name || (await fetchLeagueDetails(id))?.name;
  const slug = getLeagueSlug(leagueId, leagueName);

  permanentRedirect(`/livescore/football/leagues/${id}/${encodeURIComponent(slug)}`);
}

import { permanentRedirect } from 'next/navigation';
import { fetchCachedMatchFullData } from '@/domains/livescore/actions/match/matchData';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';

/**
 * /match/[id] → /match/[id]/[slug] 리다이렉트 전용
 * 경기 데이터에서 홈/어웨이팀 이름을 가져와 slug 생성
 */
export default async function MatchRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  let slug = 'match';

  try {
    const matchData = await fetchCachedMatchFullData(id, {
      fetchEvents: false,
      fetchLineups: false,
      fetchStats: false,
      fetchStandings: false,
    });

    if (matchData.success && matchData.match) {
      const homeTeam = matchData.match.teams?.home?.name;
      const awayTeam = matchData.match.teams?.away?.name;
      if (homeTeam && awayTeam) {
        slug = getMatchSlug(homeTeam, awayTeam);
      }
    }
  } catch {
    slug = 'match';
  }

  const tabParam = tab ? `?tab=${tab}` : '';
  permanentRedirect(`/livescore/football/match/${id}/${slug}${tabParam}`);
}

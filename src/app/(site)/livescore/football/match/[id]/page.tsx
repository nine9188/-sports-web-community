import { notFound, permanentRedirect } from 'next/navigation';
import { resolveCanonicalMatchSlug } from '@/domains/livescore/actions/match/matchSlug';

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

  const slug = await resolveCanonicalMatchSlug(id);

  if (!slug) {
    notFound();
  }

  const tabParam = tab ? `?tab=${tab}` : '';
  permanentRedirect(`/livescore/football/match/${id}/${encodeURIComponent(slug)}${tabParam}`);
}

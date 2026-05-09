import { permanentRedirect } from 'next/navigation';
import { getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { getTransferTeamHref } from '@/domains/livescore/utils/entityLinks';

export default async function TransferTeamRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const teamId = parseInt(id, 10);
  const team = Number.isFinite(teamId) ? await getTeamById(teamId) : null;
  const redirectQuery = new URLSearchParams();

  if (query.type && query.type !== 'all') redirectQuery.set('type', query.type);
  if (query.page) redirectQuery.set('page', query.page);

  const queryString = redirectQuery.toString();
  permanentRedirect(`${getTransferTeamHref(team || { id })}${queryString ? `?${queryString}` : ''}`);
}

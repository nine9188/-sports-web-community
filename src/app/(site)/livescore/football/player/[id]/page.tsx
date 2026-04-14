import { permanentRedirect } from 'next/navigation';

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

  let slug = 'player';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/football_players?player_id=eq.${id}&select=slug&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'force-cache' }
    );
    const data = await res.json();
    if (data?.[0]?.slug) slug = data[0].slug;
  } catch {
    slug = 'player';
  }

  const tabParam = tab ? `?tab=${tab}` : '';
  permanentRedirect(`/livescore/football/player/${id}/${slug}${tabParam}`);
}

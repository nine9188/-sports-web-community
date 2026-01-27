'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getRelatedPosts } from '@/domains/livescore/actions/match/relatedPosts';
import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';
import RelatedPosts from '@/domains/livescore/components/football/match/sidebar/RelatedPosts';

export default function SidebarRelatedPosts() {
  const pathname = usePathname();

  // URL에서 팀/선수 페이지 감지
  const teamMatch = pathname?.match(/\/livescore\/football\/team\/(\d+)/);
  const playerMatch = pathname?.match(/\/livescore\/football\/player\/(\d+)/);

  const entityType = teamMatch ? 'team' : playerMatch ? 'player' : null;
  const entityId = teamMatch?.[1] || playerMatch?.[1] || null;

  // 선수 페이지: 소속팀 ID 조회
  const { data: playerTeamId } = useQuery({
    queryKey: ['player-team-id', entityId],
    queryFn: async () => {
      const data = await fetchPlayerFullData(entityId!, {
        fetchSeasons: false,
        fetchStats: false,
        fetchFixtures: false,
        fetchTrophies: false,
        fetchTransfers: false,
        fetchInjuries: false,
        fetchRankings: false,
      });
      return data.playerData?.statistics?.[0]?.team?.id ?? null;
    },
    enabled: entityType === 'player' && !!entityId,
    staleTime: 10 * 60 * 1000,
  });

  // 관련 게시글 조회
  const { data: posts } = useQuery({
    queryKey: ['sidebar-related-posts', entityType, entityId, playerTeamId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      const numericId = parseInt(entityId, 10);
      if (isNaN(numericId)) return [];

      if (entityType === 'team') {
        return getRelatedPosts({ teamIds: [numericId] });
      }
      if (entityType === 'player') {
        const teamIds = playerTeamId ? [playerTeamId] : [];
        return getRelatedPosts({ playerIds: [numericId], teamIds });
      }
      return [];
    },
    enabled: !!entityType && !!entityId && (entityType === 'team' || playerTeamId !== undefined),
    staleTime: 5 * 60 * 1000,
  });

  // 팀/선수 페이지가 아니면 렌더링하지 않음
  if (!entityType) return null;

  return <RelatedPosts posts={posts ?? []} />;
}

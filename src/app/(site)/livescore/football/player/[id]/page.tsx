import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PlayerPageClient from '@/domains/livescore/components/football/player/PlayerPageClient';
import { fetchPlayerFullData, PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getPlayerKoreanName, getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import type { PlayerTabType } from '@/domains/livescore/hooks';

/**
 * ============================================
 * 선수 페이지 (서버 컴포넌트)
 * ============================================
 *
 * 클라이언트 사이드 탭 전환 패턴을 사용합니다.
 */

// 선수 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;

  // 선수 데이터 조회 (최소한의 옵션으로)
  const playerData = await fetchPlayerFullData(id, {
    fetchSeasons: false,
    fetchStats: false,
    fetchFixtures: false,
    fetchTrophies: false,
    fetchTransfers: false,
    fetchInjuries: false,
    fetchRankings: false,
  });

  if (!playerData.success || !playerData.playerData?.info) {
    return buildMetadata({
      title: '선수 정보를 찾을 수 없습니다',
      description: '요청하신 선수 정보가 존재하지 않습니다.',
      path: `/livescore/football/player/${id}`,
      noindex: true,
    });
  }

  const player = playerData.playerData.info;
  const statistics = playerData.playerData.statistics;

  // 한글 매핑 (서버 액션으로 DB 조회)
  const playerName = await getPlayerKoreanName(player.id) || player.name;
  const teamId = statistics?.[0]?.team?.id;
  const teamMapping = teamId ? getTeamById(teamId) : null;
  const currentTeam = teamMapping?.name_ko || statistics?.[0]?.team?.name || '';
  const position = statistics?.[0]?.games?.position || '';

  const description = `${playerName}${player.nationality ? ` (${player.nationality})` : ''}${currentTeam ? ` - ${currentTeam}` : ''}${position ? ` ${position}` : ''}. 시즌 통계, 경기 기록, 프로필 정보를 확인하세요.`;

  return buildMetadata({
    title: `${playerName} - 선수 정보`,
    description,
    path: `/livescore/football/player/${id}`,
  });
}

// 유효한 탭 목록
const VALID_TABS: PlayerTabType[] = ['stats', 'fixtures', 'trophies', 'transfers', 'injuries', 'rankings'];

export const dynamic = 'force-dynamic';

export default async function PlayerPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  try {
    // URL에서 ID 및 탭 가져오기
    const { id: playerId } = await params;
    const { tab = 'stats' } = await searchParams;

    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as PlayerTabType)
      ? (tab as PlayerTabType)
      : 'stats';

    // 모든 탭 데이터를 서버에서 미리 로드
    const initialData = await fetchPlayerFullData(playerId, {
      fetchSeasons: true,
      fetchStats: true,
      fetchFixtures: true,
      fetchTrophies: true,
      fetchTransfers: true,
      fetchInjuries: true,
      fetchRankings: true
    });

    // 데이터 로드 실패 시 에러 페이지 표시 (404 대신)
    if (!initialData.success) {
      console.error(`[PlayerPage] 데이터 로드 실패 - playerId: ${playerId}, message: ${initialData.message}`);
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              선수 정보를 불러올 수 없습니다
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {initialData.message || '잠시 후 다시 시도해주세요.'}
            </p>
            <a
              href="/livescore/football"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              라이브스코어로 돌아가기
            </a>
          </div>
        </div>
      );
    }

    // 선수 한글명 조회 (DB)
    const playerNumericId = parseInt(playerId, 10);
    const playerKoreanName = !isNaN(playerNumericId) ? await getPlayerKoreanName(playerNumericId) : null;

    // Rankings 데이터에서 선수 ID 추출 및 한글명 일괄 조회
    const rankingsPlayerIds: Set<number> = new Set();
    const rankings = initialData.rankings;
    if (rankings) {
      const rankingLists = [
        rankings.topScorers,
        rankings.topAssists,
        rankings.mostGamesScored,
        rankings.leastPlayTime,
        rankings.topRedCards,
        rankings.topYellowCards,
      ];
      rankingLists.forEach(list => {
        list?.forEach((p: { player?: { id?: number } }) => {
          if (p.player?.id) rankingsPlayerIds.add(p.player.id);
        });
      });
    }
    const rankingsKoreanNames = rankingsPlayerIds.size > 0
      ? await getPlayersKoreanNames(Array.from(rankingsPlayerIds))
      : {};

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <PlayerPageClient
        playerId={playerId}
        initialTab={initialTab}
        initialData={initialData}
        playerKoreanName={playerKoreanName}
        rankingsKoreanNames={rankingsKoreanNames}
      />
    );
  } catch (error) {
    console.error('플레이어 페이지 로딩 오류:', error);
    return notFound();
  }
}

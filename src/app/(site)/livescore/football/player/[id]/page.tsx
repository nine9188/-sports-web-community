import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PlayerPageClient from '@/domains/livescore/components/football/player/PlayerPageClient';
import { fetchPlayerFullData, PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
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

  // 한글 매핑
  const playerName = getPlayerKoreanName(player.id) || player.name;
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

// 캐시 항목 인터페이스
interface CacheEntry {
  data: PlayerFullDataResponse;
  timestamp: number;
}

// 글로벌 데이터 캐시 (서버 재시작될 때까지 유지)
const dataCache = new Map<string, CacheEntry>();

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

// 캐시 유효성 체크 함수
const isCacheValid = (cacheEntry: CacheEntry | undefined): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// 유효한 탭 목록
const VALID_TABS: PlayerTabType[] = ['stats', 'fixtures', 'trophies', 'transfers', 'injuries', 'rankings'];

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5분마다 재검증

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

    // 캐시 키 생성 (초기 탭 기준)
    const cacheKey = `${playerId}-${initialTab}`;

    // 캐시된 데이터 확인
    let initialData: PlayerFullDataResponse;
    const cacheEntry = dataCache.get(cacheKey);

    if (cacheEntry && isCacheValid(cacheEntry)) {
      // 유효한 캐시 데이터가 있으면 사용
      initialData = cacheEntry.data;
    } else {
      // 모든 탭 데이터를 서버에서 미리 로드 (빠른 탭 전환을 위해)
      const loadOptions = {
        fetchSeasons: true,
        fetchStats: true,
        fetchFixtures: true,        // API 최적화 완료 - 미리 로드
        fetchTrophies: true,
        fetchTransfers: true,
        fetchInjuries: true,
        fetchRankings: true
      };

      initialData = await fetchPlayerFullData(playerId, loadOptions);

      // 캐시에 저장
      dataCache.set(cacheKey, {
        data: initialData,
        timestamp: Date.now()
      });
    }

    // 데이터 로드 실패 시 404
    if (!initialData.success) {
      return notFound();
    }

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <PlayerPageClient
        playerId={playerId}
        initialTab={initialTab}
        initialData={initialData}
      />
    );
  } catch (error) {
    console.error('플레이어 페이지 로딩 오류:', error);
    return notFound();
  }
}

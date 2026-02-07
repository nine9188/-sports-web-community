'use server';

import { cache } from 'react';
import {
  sortTransfersByDate,
} from '../../utils/transferUtils';
import { getTransfersCache, setTransfersCache, getTeamTransfersCache, setTeamTransfersCache } from './transfersCache';

// 이적 데이터 타입 정의
export interface TransferMarketData {
  player: {
    id: number;
    name: string;
    photo: string;
    age: number;
    nationality: string;
  };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: {
        id: number;
        name: string;
        logo: string;
      };
      out: {
        id: number;
        name: string;
        logo: string;
      };
    };
  }>;
}

// 팀별 이적 정보 타입
export interface TeamTransfersData {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  transfers: {
    in: TransferMarketData[];
    out: TransferMarketData[];
  };
}

// 리그별 이적 정보 필터 타입
export interface TransferFilters {
  league?: number;
  team?: number;
  season?: number;
  type?: 'in' | 'out' | 'all';
}

// API 응답 타입 정의
interface ApiTransferResponse {
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  player?: {
    id: number;
    name: string;
    photo: string;
    age: number;
    nationality: string;
  };
  update?: string;
  transfers?: Array<{
    date?: string;
    type?: string;
    teams?: {
      in?: {
        id?: number;
        name?: string;
        logo?: string;
      };
      out?: {
        id?: number;
        name?: string;
        logo?: string;
      };
    };
  }>;
}

// 주요 리그 ID들
const MAJOR_LEAGUES = [39, 140, 135, 78, 61]; // 프리미어리그, 라리가, 세리에A, 분데스리가, 리그1

/**
 * 날짜 형식 검증 함수 (YYYY-MM-DD 형식만 허용)
 */
function isValidDateFormat(dateString: string): boolean {
  if (!dateString) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  if (year < 1990 || year > 2030) return false;

  return true;
}

/**
 * 이적 데이터 검증 및 필터링
 */
function validateTransfers(transfers: TransferMarketData[]): TransferMarketData[] {
  const seen = new Set<string>();

  return transfers.filter(transfer => {
    if (!transfer.player?.id || transfer.player.id <= 0 || !transfer.player?.name) {
      return false;
    }

    if (!transfer.transfers?.[0] || !transfer.transfers[0].date) {
      return false;
    }

    const transferData = transfer.transfers[0];

    if (!isValidDateFormat(transferData.date)) {
      return false;
    }

    if (!transferData.teams?.in?.id || !transferData.teams?.out?.id) {
      return false;
    }

    const teamInName = transferData.teams.in.name;
    const teamOutName = transferData.teams.out.name;

    if (!teamInName || !teamOutName) return false;
    if (/^[0-9]+$/.test(teamInName.trim()) || /^[0-9]+$/.test(teamOutName.trim())) return false;
    if (teamInName.trim().startsWith('0') || teamOutName.trim().startsWith('0')) return false;
    if (teamInName.trim().length < 2 || teamOutName.trim().length < 2) return false;
    if (transferData.teams.in.id <= 0 || transferData.teams.out.id <= 0) return false;

    const key = `${transfer.player.id}-${transferData.date}-${transferData.teams.in.id}-${transferData.teams.out.id}`;
    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}

/**
 * 팀별 이적 정보 가져오기 (캐시 적용)
 */
export const fetchTeamTransfers = cache(async (
  teamId: number
): Promise<TeamTransfersData | null> => {
  try {
    if (!teamId) return null;

    // 1. 캐시 확인
    const cached = await getTeamTransfersCache(teamId);
    if (cached.data !== null && cached.fresh) {
      return cached.data as TeamTransfersData;
    }

    // 2. API 호출
    const response = await fetch(`https://v3.football.api-sports.io/transfers?team=${teamId}`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      return {
        team: { id: teamId, name: '', logo: '' },
        transfers: { in: [], out: [] }
      };
    }

    // 3. 데이터 처리
    const result = processTeamTransferData(data, teamId);

    // 4. 캐시 저장
    setTeamTransfersCache(teamId, result).catch(() => {});

    return result;
  } catch (error) {
    console.error('팀 이적 정보 가져오기 오류:', error);
    return null;
  }
});

/**
 * 팀 이적 데이터 처리 함수
 */
function processTeamTransferData(
  data: { response: ApiTransferResponse[] },
  teamId: number
): TeamTransfersData {
  const teamData = data.response[0];
  const teamInfo = teamData?.team || { id: teamId, name: '', logo: '' };

  const transfersIn: TransferMarketData[] = [];
  const transfersOut: TransferMarketData[] = [];

  data.response.forEach((transfer: ApiTransferResponse) => {
    if (!transfer.transfers || !Array.isArray(transfer.transfers)) return;

    transfer.transfers.forEach((t) => {
      if (!isValidDateFormat(t.date || '')) return;

      const transferData: TransferMarketData = {
        player: {
          id: transfer.player?.id || 0,
          name: transfer.player?.name || '',
          photo: transfer.player?.photo || '',
          age: transfer.player?.age || 0,
          nationality: transfer.player?.nationality || ''
        },
        update: transfer.update || '',
        transfers: [{
          date: t.date || '',
          type: t.type || '',
          teams: {
            in: {
              id: t.teams?.in?.id || 0,
              name: t.teams?.in?.name || '',
              logo: t.teams?.in?.logo || ''
            },
            out: {
              id: t.teams?.out?.id || 0,
              name: t.teams?.out?.name || '',
              logo: t.teams?.out?.logo || ''
            }
          }
        }]
      };

      if (t.teams?.in?.id === teamId) {
        transfersIn.push(transferData);
      } else if (t.teams?.out?.id === teamId) {
        transfersOut.push(transferData);
      }
    });
  });

  return {
    team: {
      id: teamInfo.id,
      name: teamInfo.name,
      logo: teamInfo.logo
    },
    transfers: {
      in: sortTransfersByDate(transfersIn),
      out: sortTransfersByDate(transfersOut)
    }
  };
}

/**
 * 리그별 이적 정보 가져오기 (캐시 적용)
 */
async function fetchLeagueTransfersFromAPI(
  leagueId: number,
  season: number = 2025
): Promise<TransferMarketData[]> {
  try {
    // 리그 팀 목록 가져오기
    const teamsResponse = await fetch(
      `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        next: { revalidate: 7200 }
      }
    );

    if (!teamsResponse.ok) return [];

    const teamsData = await teamsResponse.json();
    if (!teamsData.response || teamsData.response.length === 0) return [];

    // 상위 12개 팀의 이적 정보 수집
    const teamIds = teamsData.response.slice(0, 12).map((team: { team: { id: number } }) => team.team.id);

    const allTransfers: TransferMarketData[] = [];

    const transferPromises = teamIds.map(async (teamId: number) => {
      try {
        const teamTransfers = await fetchTeamTransfers(teamId);
        if (teamTransfers) {
          return [...teamTransfers.transfers.in, ...teamTransfers.transfers.out];
        }
        return [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(transferPromises);
    results.forEach(transfers => allTransfers.push(...transfers));

    // 검증 및 정렬
    const validated = validateTransfers(allTransfers);
    return validated.sort((a, b) =>
      new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime()
    );
  } catch {
    return [];
  }
}

// ============================================
// 메인 데이터 fetch 함수 (페이지에서 사용)
// ============================================

export interface TransfersFullDataResponse {
  success: boolean;
  message: string;
  transfers: TransferMarketData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: TransferFilters;
}

/**
 * 이적시장 페이지용 통합 데이터 fetch 함수
 * - Supabase 캐시 사용 (24시간 TTL)
 * - 서버 사이드 페이지네이션
 */
export const fetchTransfersFullData = cache(async (
  filters: TransferFilters = {},
  page: number = 1,
  itemsPerPage: number = 20
): Promise<TransfersFullDataResponse> => {
  try {
    const leagueId = filters.league || MAJOR_LEAGUES[0]; // 기본: 프리미어리그
    const currentSeason = filters.season || 2025;

    let allTransfers: TransferMarketData[] = [];

    // 특정 팀이 선택된 경우
    if (filters.team) {
      const teamTransfers = await fetchTeamTransfers(filters.team);
      if (teamTransfers) {
        if (filters.type === 'in') {
          allTransfers = teamTransfers.transfers.in;
        } else if (filters.type === 'out') {
          allTransfers = teamTransfers.transfers.out;
        } else {
          allTransfers = [...teamTransfers.transfers.in, ...teamTransfers.transfers.out];
        }
      }
    } else {
      // 리그별 이적 정보 (캐시 적용)
      const cached = await getTransfersCache(leagueId, currentSeason);

      if (cached.data !== null && cached.fresh) {
        allTransfers = cached.data as TransferMarketData[];
      } else {
        // 캐시 없으면 API 호출
        allTransfers = await fetchLeagueTransfersFromAPI(leagueId, currentSeason);

        // 캐시 저장
        setTransfersCache(leagueId, allTransfers, currentSeason).catch(() => {});
      }
    }

    // 검증 및 정렬
    const validated = validateTransfers(allTransfers);
    const sorted = validated.sort((a, b) =>
      new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime()
    );

    // 페이지네이션
    const totalCount = sorted.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedTransfers = sorted.slice(startIndex, startIndex + itemsPerPage);

    return {
      success: true,
      message: '이적 데이터를 성공적으로 가져왔습니다',
      transfers: paginatedTransfers,
      totalCount,
      currentPage: page,
      totalPages,
      filters
    };
  } catch (error) {
    console.error('이적 데이터 fetch 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      transfers: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      filters
    };
  }
});

// 기존 함수들 호환성 유지
export const fetchLatestTransfers = async (
  filters: TransferFilters = {},
  limit: number = 30
): Promise<TransferMarketData[]> => {
  const result = await fetchTransfersFullData(filters, 1, limit);
  return result.transfers;
};

// 타입 별칭 export
export type TransferData = TransferMarketData;

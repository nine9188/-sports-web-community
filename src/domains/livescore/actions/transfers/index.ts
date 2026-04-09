'use server';

import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// ── 타입 정의 ──

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

export interface TransferFilters {
  league?: number;
  team?: number;
  season?: number;
  type?: 'in' | 'out' | 'all';
}

export interface TransfersFullDataResponse {
  success: boolean;
  message: string;
  transfers: TransferMarketData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: TransferFilters;
}

// ── 메인 데이터 fetch 함수 (API 직접 호출, DB 불필요) ──

/**
 * 이적시장 페이지용 통합 데이터 fetch 함수
 * API-Sports에서 직접 조회 (Next.js 캐시 24시간)
 * - 팀 선택 필수: API 1회 호출로 해당 팀의 모든 이적 데이터 조회
 * - 리그만 선택: 팀을 먼저 선택하라는 안내 반환
 */
export const fetchTransfersFullData = cache(async (
  filters: TransferFilters = {},
  page: number = 1,
  itemsPerPage: number = 20
): Promise<TransfersFullDataResponse> => {
  try {
    // 팀이 선택되지 않으면 빈 결과 (리그 선택 → 팀 선택 유도)
    if (!filters.team) {
      return {
        success: true,
        message: filters.league ? '팀을 선택하면 이적 정보를 확인할 수 있습니다' : '리그와 팀을 선택하면 이적 정보를 확인할 수 있습니다',
        transfers: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        filters,
      };
    }

    // API에서 해당 팀의 이적 데이터 가져오기 (Next.js 캐시 24시간)
    const data = await fetchFromFootballApi('transfers', { team: filters.team });

    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      return {
        success: true,
        message: '이적 데이터가 없습니다',
        transfers: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        filters,
      };
    }

    // API 응답 → TransferMarketData 변환
    const allTransfers: TransferMarketData[] = [];
    const teamId = filters.team;

    for (const item of data.response) {
      if (!item.player?.id || !item.transfers) continue;

      for (const t of item.transfers) {
        if (!t.date || !t.teams?.in?.id || !t.teams?.out?.id) continue;
        // 날짜 유효성 (2020~2030)
        const year = new Date(t.date).getFullYear();
        if (isNaN(year) || year < 2020 || year > 2030) continue;

        // 영입/방출 필터
        if (filters.type === 'in' && t.teams.in.id !== teamId) continue;
        if (filters.type === 'out' && t.teams.out.id !== teamId) continue;
        // 타입 미선택 시 해당 팀 관련 이적만
        if (!filters.type && t.teams.in.id !== teamId && t.teams.out.id !== teamId) continue;

        allTransfers.push({
          player: {
            id: item.player.id,
            name: item.player.name || '',
            photo: '',
            age: 0,
            nationality: '',
          },
          update: '',
          transfers: [{
            date: t.date,
            type: t.type || '',
            teams: {
              in: { id: t.teams.in.id, name: t.teams.in.name || '', logo: t.teams.in.logo || '' },
              out: { id: t.teams.out.id, name: t.teams.out.name || '', logo: t.teams.out.logo || '' },
            },
          }],
        });
      }
    }

    // 날짜 내림차순 정렬
    allTransfers.sort((a, b) => new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime());

    // 페이지네이션
    const totalCount = allTransfers.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const transfers = allTransfers.slice(startIndex, startIndex + itemsPerPage);

    return {
      success: true,
      message: '이적 데이터를 성공적으로 가져왔습니다',
      transfers,
      totalCount,
      currentPage: page,
      totalPages,
      filters,
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
      filters,
    };
  }
});

// ── 팀 상세 페이지용 (API 직접 호출) ──

import {
  sortTransfersByDate,
} from '../../utils/transferUtils';

interface ApiTransferResponse {
  team?: { id: number; name: string; logo: string };
  player?: { id: number; name: string; photo: string; age: number; nationality: string };
  update?: string;
  transfers?: Array<{
    date?: string;
    type?: string;
    teams?: {
      in?: { id?: number; name?: string; logo?: string };
      out?: { id?: number; name?: string; logo?: string };
    };
  }>;
}

function isValidDateFormat(dateString: string): boolean {
  if (!dateString) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  return year >= 1990 && year <= 2030;
}

/**
 * 팀별 이적 정보 가져오기 (팀 상세 페이지용)
 * 이적시장 페이지에서는 사용하지 않음 — DB 캐시 사용
 */
export const fetchTeamTransfers = cache(async (
  teamId: number
): Promise<TeamTransfersData | null> => {
  try {
    if (!teamId) return null;
    const data = await fetchFromFootballApi('transfers', { team: teamId });

    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      return { team: { id: teamId, name: '', logo: '' }, transfers: { in: [], out: [] } };
    }

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
            nationality: transfer.player?.nationality || '',
          },
          update: transfer.update || '',
          transfers: [{
            date: t.date || '',
            type: t.type || '',
            teams: {
              in: { id: t.teams?.in?.id || 0, name: t.teams?.in?.name || '', logo: t.teams?.in?.logo || '' },
              out: { id: t.teams?.out?.id || 0, name: t.teams?.out?.name || '', logo: t.teams?.out?.logo || '' },
            },
          }],
        };
        if (t.teams?.in?.id === teamId) transfersIn.push(transferData);
        else if (t.teams?.out?.id === teamId) transfersOut.push(transferData);
      });
    });

    return {
      team: { id: teamInfo.id, name: teamInfo.name, logo: teamInfo.logo },
      transfers: { in: sortTransfersByDate(transfersIn), out: sortTransfersByDate(transfersOut) },
    };
  } catch (error) {
    console.error('팀 이적 정보 가져오기 오류:', error);
    return null;
  }
});

// ── 호환성 유지 ──

export const fetchLatestTransfers = async (
  filters: TransferFilters = {},
  limit: number = 30
): Promise<TransferMarketData[]> => {
  const result = await fetchTransfersFullData(filters, 1, limit);
  return result.transfers;
};

export type TransferData = TransferMarketData;

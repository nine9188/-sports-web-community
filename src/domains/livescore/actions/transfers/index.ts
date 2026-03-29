'use server';

import { cache } from 'react';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

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

// ── Tier 1~3 캐시 대상 리그 ──

const CACHED_LEAGUES = [
  39, 140, 135, 78, 61,    // Tier 1: 5대 리그
  292, 40, 88, 94,          // Tier 2
  98, 253, 307, 71,         // Tier 3
];

// "전체 리그" 기본 조회 대상 (캐시된 Tier 1~3 전체)
const DEFAULT_LEAGUES = CACHED_LEAGUES;

// ── DB 레코드 → TransferMarketData 변환 ──

interface TransferCacheRow {
  player_id: number;
  player_name: string;
  player_photo: string;
  player_age: number;
  player_nationality: string;
  league_id: number;
  team_in_id: number;
  team_in_name: string;
  team_in_logo: string;
  team_out_id: number;
  team_out_name: string;
  team_out_logo: string;
  transfer_date: string;
  transfer_type: string;
}

function rowToTransferMarketData(row: TransferCacheRow): TransferMarketData {
  return {
    player: {
      id: row.player_id,
      name: row.player_name,
      photo: row.player_photo || '',
      age: row.player_age || 0,
      nationality: row.player_nationality || '',
    },
    update: '',
    transfers: [{
      date: row.transfer_date,
      type: row.transfer_type || '',
      teams: {
        in: {
          id: row.team_in_id,
          name: row.team_in_name,
          logo: row.team_in_logo || '',
        },
        out: {
          id: row.team_out_id,
          name: row.team_out_name,
          logo: row.team_out_logo || '',
        },
      },
    }],
  };
}

// ── 메인 데이터 fetch 함수 (DB 기반) ──

/**
 * 이적시장 페이지용 통합 데이터 fetch 함수
 * Supabase transfer_cache 테이블에서 직접 조회 (API 호출 없음)
 * - 서버 사이드 페이지네이션
 * - Tier 1~3: DB 캐시에서 즉시 조회
 * - Tier 4: DB 캐시에 없으면 빈 결과 (리그 선택 시 개별 안내)
 */
export const fetchTransfersFullData = cache(async (
  filters: TransferFilters = {},
  page: number = 1,
  itemsPerPage: number = 20
): Promise<TransfersFullDataResponse> => {
  try {
    const supabase = getSupabaseAdmin();

    // 기본 쿼리 빌더
    let query = supabase
      .from('transfer_cache')
      .select('*', { count: 'exact' });

    // 필터 적용
    if (filters.team) {
      // 특정 팀 선택: 영입 또는 방출
      if (filters.type === 'in') {
        query = query.eq('team_in_id', filters.team);
      } else if (filters.type === 'out') {
        query = query.eq('team_out_id', filters.team);
      } else {
        query = query.or(`team_in_id.eq.${filters.team},team_out_id.eq.${filters.team}`);
      }
    } else if (filters.league) {
      // 특정 리그 선택
      query = query.eq('league_id', filters.league);
    } else {
      // 기본: 5대 리그만
      query = query.in('league_id', DEFAULT_LEAGUES);
    }

    // 정렬 + 페이지네이션
    const startIndex = (page - 1) * itemsPerPage;
    query = query
      .order('transfer_date', { ascending: false })
      .range(startIndex, startIndex + itemsPerPage - 1);

    const { data: rows, count, error } = await query;

    if (error) {
      console.error('이적 캐시 조회 오류:', error);
      return {
        success: false,
        message: `DB 조회 오류: ${error.message}`,
        transfers: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        filters,
      };
    }

    const transfers = (rows || []).map(rowToTransferMarketData);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

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

// ── 팀 상세 페이지용 (기존 API 직접 호출 유지) ──

import {
  sortTransfersByDate,
} from '../../utils/transferUtils';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

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

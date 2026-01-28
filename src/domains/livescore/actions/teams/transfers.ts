'use server';

import { cache } from 'react';

// 이적 정보 인터페이스
export interface TransferTeam {
  id: number;
  name: string;
  logo: string;
}

export interface TransferPlayer {
  id: number;
  name: string;
}

export interface TransferInRecord {
  player: TransferPlayer;
  date: string;
  type: string;
  fromTeam: TransferTeam;
}

export interface TransferOutRecord {
  player: TransferPlayer;
  date: string;
  type: string;
  toTeam: TransferTeam;
}

// 팀 기준으로 정리된 이적 데이터
export interface TeamTransfersData {
  in: TransferInRecord[];
  out: TransferOutRecord[];
}

interface TransfersResponse {
  success: boolean;
  data?: TeamTransfersData;
  message: string;
}

// API 응답 타입
interface ApiTransferEntry {
  date?: string;
  type?: string;
  teams?: {
    in?: { id?: number; name?: string; logo?: string };
    out?: { id?: number; name?: string; logo?: string };
  };
}

interface ApiTransferRecord {
  player?: { id?: number; name?: string };
  transfers?: ApiTransferEntry[];
}

/**
 * YYYY-MM-DD 날짜 형식 검증
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  return year >= 1990 && year <= 2030;
}

/**
 * 팀 정보 유효성 검증
 */
function isValidTeam(team?: { id?: number; name?: string; logo?: string }): team is { id: number; name: string; logo: string } {
  if (!team || !team.id || team.id <= 0) return false;
  if (!team.name || team.name.trim().length < 2) return false;
  if (/^[0-9]+$/.test(team.name.trim())) return false;
  return true;
}

/**
 * 특정 팀의 이적 정보를 가져오는 서버 액션
 * 최근 이적만 필터링하여 반환합니다.
 */
export async function fetchTeamTransfers(teamId: string): Promise<TransfersResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    const apiKey = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';

    if (!apiKey) {
      return { success: false, message: 'API 키가 설정되지 않았습니다' };
    }

    const numericTeamId = parseInt(teamId, 10);

    const response = await fetch(
      `https://v3.football.api-sports.io/transfers?team=${teamId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const json = await response.json();
    const records: ApiTransferRecord[] = json?.response || [];

    // 최근 18개월 이내 이적만 포함
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 18);
    const cutoffTime = cutoffDate.getTime();

    // 영입/방출을 Map으로 수집 (선수+팀+타입 조합별로 최신 날짜만 유지)
    const inMap = new Map<string, TransferInRecord>();
    const outMap = new Map<string, TransferOutRecord>();

    for (const record of records) {
      if (!record.player?.id || !record.player?.name || !record.transfers) continue;

      for (const transfer of record.transfers) {
        // 날짜 검증
        if (!isValidDate(transfer.date || '')) continue;

        // 최근 이적만 (타임존 이슈 방지를 위해 T00:00:00 추가)
        const transferTime = new Date(transfer.date + 'T00:00:00').getTime();
        if (transferTime < cutoffTime) continue;

        // 팀 정보 검증
        if (!isValidTeam(transfer.teams?.in) || !isValidTeam(transfer.teams?.out)) continue;

        const teamIn = transfer.teams!.in!;
        const teamOut = transfer.teams!.out!;

        if (teamIn.id === numericTeamId) {
          // 영입: 선수ID + 이전팀ID + 이적타입으로 그룹화
          const groupKey = `${record.player.id}-${teamOut.id}-${transfer.type || 'N/A'}`;
          const existing = inMap.get(groupKey);

          // 같은 그룹 중 가장 최신 날짜만 유지
          if (!existing || transfer.date! > existing.date) {
            inMap.set(groupKey, {
              player: { id: record.player.id, name: record.player.name },
              date: transfer.date!,
              type: transfer.type || 'N/A',
              fromTeam: { id: teamOut.id!, name: teamOut.name!, logo: teamOut.logo || '' },
            });
          }
        } else if (teamOut.id === numericTeamId) {
          // 방출: 선수ID + 이적팀ID + 이적타입으로 그룹화
          const groupKey = `${record.player.id}-${teamIn.id}-${transfer.type || 'N/A'}`;
          const existing = outMap.get(groupKey);

          // 같은 그룹 중 가장 최신 날짜만 유지
          if (!existing || transfer.date! > existing.date) {
            outMap.set(groupKey, {
              player: { id: record.player.id, name: record.player.name },
              date: transfer.date!,
              type: transfer.type || 'N/A',
              toTeam: { id: teamIn.id!, name: teamIn.name!, logo: teamIn.logo || '' },
            });
          }
        }
      }
    }

    // Map에서 배열로 변환
    const inTransfers = Array.from(inMap.values());
    const outTransfers = Array.from(outMap.values());

    // 날짜 내림차순 정렬 (최신순)
    inTransfers.sort((a, b) => b.date.localeCompare(a.date));
    outTransfers.sort((a, b) => b.date.localeCompare(a.date));

    return {
      success: true,
      data: { in: inTransfers, out: outTransfers },
      message: '이적 데이터를 성공적으로 가져왔습니다',
    };
  } catch (error) {
    console.error('이적 정보 가져오기 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedTeamTransfers = cache(fetchTeamTransfers);

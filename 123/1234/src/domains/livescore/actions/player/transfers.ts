'use server';

import { cache } from 'react';
import { TransferData } from '@/domains/livescore/types/player';

// API 응답 타입 정의
interface ApiTransferResponse {
  player: {
    id: number;
    name: string;
  };
  update?: string;
  transfers: Array<{
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

/**
 * 선수 이적 기록 가져오기
 * @param playerId 선수 ID
 * @returns 이적 기록 목록
 */
export async function fetchPlayerTransfers(playerId: number): Promise<TransferData[]> {
  try {
    if (!playerId) {
      return [];
    }

    // API 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/transfers?player=${playerId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      console.error(`[transfers] API 응답 오류: ${response.status}`, await response.text());
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // 데이터 존재 확인
    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      return [];
    }

    // 응답은 배열이지만 첫 번째 요소에 모든 이적 기록이 포함됨
    const playerData = data.response[0] as ApiTransferResponse;
    
    // 이적 기록이 없으면 빈 배열 반환
    if (!playerData.transfers || !Array.isArray(playerData.transfers)) {
      return [];
    }

    // 이적 기록 데이터 변환
    const transfers: TransferData[] = playerData.transfers.map(transfer => {
      try {
        // 데이터 무결성 검사
        const fromTeam = transfer.teams?.out || {};
        const toTeam = transfer.teams?.in || {};
        
        return {
          date: transfer.date || '',
          type: transfer.type || 'N/A',
          teams: {
            from: {
              id: fromTeam.id || 0,
              name: fromTeam.name || '알 수 없는 팀',
              logo: fromTeam.logo || '',
            },
            to: {
              id: toTeam.id || 0,
              name: toTeam.name || '알 수 없는 팀',
              logo: toTeam.logo || '',
            },
          },
        };
      } catch (err) {
        console.error('[transfers] 이적 데이터 변환 오류:', err);
        // 오류가 발생해도 건너뛰지 않고 최소한의 데이터 반환
        return {
          date: '',
          type: 'N/A',
          teams: {
            from: { id: 0, name: '데이터 오류', logo: '' },
            to: { id: 0, name: '데이터 오류', logo: '' },
          },
        };
      }
    }).filter((t: TransferData) => t.teams.from.name !== '데이터 오류' || t.teams.to.name !== '데이터 오류');

    // 최신 이적 순으로 정렬
    const sortedTransfers = transfers.sort((a, b) => {
      // 날짜가 없으면 가장 오래된 것으로 간주
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      // 최신 날짜가 먼저 오도록 내림차순 정렬
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return sortedTransfers;
  } catch (error) {
    console.error('선수 이적 기록 가져오기 오류:', error);
    return [];
  }
}

// 캐싱 적용 함수
export const fetchCachedPlayerTransfers = cache(fetchPlayerTransfers); 
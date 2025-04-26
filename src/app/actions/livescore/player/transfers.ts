'use server';

import { cache } from 'react';

interface Transfer {
  date: string;
  type: string;
  teams: {
    from: {
      id: number;
      name: string;
      logo: string;
    };
    to: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

// API 응답 타입 정의
interface ApiTransfer {
  date: string;
  type: string;
  teams: {
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
}

// 메모리 캐시 (서버 재시작될 때까지 유지)
const transfersCache = new Map<string, {
  timestamp: number; 
  data: Transfer[];
}>();

// 캐시 유효 시간: 6시간 (단위: 밀리초)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * 특정 선수의 이적 기록을 가져오는 서버 액션
 * @param playerId 선수 ID
 * @returns 이적 기록 데이터
 */
export async function fetchPlayerTransfers(playerId: number): Promise<Transfer[]> {
  try {
    if (!playerId) {
      throw new Error('선수 ID가 필요합니다');
    }

    // 캐시 키 생성
    const cacheKey = `player_transfers_${playerId}`;
    
    // 캐시 확인
    const cachedData = transfersCache.get(cacheKey);
    const now = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return cachedData.data;
    }

    // API 요청
    const response = await fetch(
      `https://v3.football.api-sports.io/transfers?player=${playerId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        // 캐싱 적용
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const transfersData = await response.json();

    // API 응답이 없거나 비어있는 경우
    if (!transfersData.response || transfersData.response.length === 0) {
      // 빈 결과 캐싱 (재요청 방지)
      transfersCache.set(cacheKey, {
        timestamp: now,
        data: []
      });
      return [];
    }

    // 응답 데이터 포맷팅 - transfers 배열에서 데이터 추출
    const formattedTransfers = transfersData.response[0].transfers.map((transfer: ApiTransfer) => ({
      date: transfer.date || '',
      type: transfer.type || '',
      teams: {
        from: {
          id: transfer.teams?.out?.id || 0,
          name: transfer.teams?.out?.name || '',
          logo: transfer.teams?.out?.logo || '',
        },
        to: {
          id: transfer.teams?.in?.id || 0,
          name: transfer.teams?.in?.name || '',
          logo: transfer.teams?.in?.logo || '',
        }
      }
    }));

    // 최신 이적 순으로 정렬
    const sortedTransfers = formattedTransfers.sort((a: Transfer, b: Transfer) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 캐시에 결과 저장
    transfersCache.set(cacheKey, {
      timestamp: now,
      data: sortedTransfers as Transfer[]
    });

    return sortedTransfers as Transfer[];

  } catch {
    return [] as Transfer[];
  }
}

/**
 * 캐싱을 적용한 선수 이적 기록 가져오기
 */
export const fetchCachedPlayerTransfers = cache(fetchPlayerTransfers); 
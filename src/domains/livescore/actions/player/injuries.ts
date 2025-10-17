'use server';

import { cache } from 'react';
import { InjuryData } from '@/domains/livescore/types/player';

// API 응답 데이터 인터페이스
interface ApiInjuryResponse {
  player?: {
    id?: number;
    name?: string;
    type?: string;
    reason?: string;
  };
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  fixture?: {
    id?: number;
    date?: string;
  };
  league?: {
    id?: number;
    name?: string;
    season?: string;
  };
  injury?: {
    type?: string;
    reason?: string;
  };
  type?: string;
  reason?: string;
}

// 부상 유형 한글 매핑
const typeMap: { [key: string]: string } = {
  'Missing Fixture': '결장',
  'Questionable': '출전 불투명',
  'Unknown': '미정'
};

// 부상 사유 한글 매핑
const reasonMap: { [key: string]: string } = {
  "Coach's decision": '감독 결정',
  'Thigh Injury': '허벅지 부상',
  'National selection': '국가대표 차출',
  'Rest': '휴식',
  'Knock': '타박상',
  'Muscle Injury': '근육 부상',
  'Ankle Injury': '발목 부상',
  'Knee Injury': '무릎 부상',
  'Hamstring': '햄스트링',
  'Calf Injury': '종아리 부상',
  'Back Injury': '등 부상',
  'Shoulder Injury': '어깨 부상',
  'Illness': '질병',
  'Suspended': '출전 정지',
  'Foot Injury': '발 부상'
};

/**
 * 선수 부상 기록 가져오기
 * @param playerId 선수 ID
 * @returns 부상 기록 목록
 */
export async function fetchPlayerInjuries(playerId: number): Promise<InjuryData[]> {
  try {
    if (!playerId) {
      return [];
    }

    // 현재 시즌과 이전 시즌 계산
    const currentYear = new Date().getFullYear();
    const seasons = [
      `${currentYear}`,
      `${currentYear-1}`,
      `${currentYear-2}`
    ];

    // 모든 시즌의 부상 데이터를 가져오기 위한 Promise 배열
    const injuryPromises = seasons.map(season => {
      const apiUrl = `https://v3.football.api-sports.io/injuries?player=${playerId}&season=${season}`;
      
      return fetch(
        apiUrl,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );
    });

    // 모든 요청을 병렬로 처리
    const responses = await Promise.all(injuryPromises);
    
    // 모든 응답 데이터 병렬 처리로 수집
    const responsesData = await Promise.all(
      responses.map(response => 
        response.ok ? response.json() : { response: [] }
      )
    );
    
    // 모든 부상 데이터 합치기
    let allInjuries: ApiInjuryResponse[] = [];
    responsesData.forEach((data) => {
      if (data.response && data.response.length > 0) {
        allInjuries = [...allInjuries, ...data.response];
      }
    });

    // 부상 기록 데이터 변환
    const injuries: InjuryData[] = allInjuries.map((injury: ApiInjuryResponse) => {
      // 타입과 이유 값 안전하게 추출
      const playerType = injury.player?.type;
      const injuryType = injury.type;
      const playerReason = injury.player?.reason;
      const injuryReason = injury.reason;
      
      // 타입과 이유 결정 (우선순위: 매핑 값 > 원본 값 > 기본값)
      const typeKey = playerType || injuryType || '';
      const reasonKey = playerReason || injuryReason || '';
      
      const mappedType = typeKey ? (typeMap[typeKey] || typeKey) : '정보 없음';
      const mappedReason = reasonKey ? (reasonMap[reasonKey] || reasonKey) : '정보 없음';
      
      return {
        team: {
          id: injury.team?.id || 0,
          name: injury.team?.name || '',
          logo: injury.team?.logo || '',
        },
        fixture: {
          date: injury.fixture?.date || '',
        },
        league: {
          name: injury.league?.name || '',
          season: injury.league?.season || '',
        },
        type: mappedType,
        reason: mappedReason,
      };
    });

    // 최신 부상 순으로 정렬
    const sortedInjuries = injuries.sort((a, b) => {
      // 날짜가 없으면 가장 오래된 것으로 간주
      if (!a.fixture.date) return 1;
      if (!b.fixture.date) return -1;
      
      // 최신 날짜가 먼저 오도록 내림차순 정렬
      return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
    });
    return sortedInjuries;
  } catch (error) {
    console.error('선수 부상 기록 가져오기 오류:', error);
    return [];
  }
}

// 캐싱 적용 함수
export const fetchCachedPlayerInjuries = cache(fetchPlayerInjuries); 
'use server';

import { cache } from 'react';

interface Injury {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  type: string;
  reason: string;
}

// API 응답을 위한 인터페이스 정의
interface ApiInjuryResponse {
  fixture: {
    date: string;
  };
  league: {
    name: string;
    season: string;
  };
  team: {
    name: string;
    logo: string;
  };
  player?: {
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

// 메모리 캐시 (서버 재시작될 때까지 유지)
const injuriesCache = new Map<string, {
  timestamp: number; 
  data: Injury[];
}>();

// 캐시 유효 시간: 6시간 (단위: 밀리초)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * 특정 선수의 부상 기록을 가져오는 서버 액션
 * @param playerId 선수 ID
 * @returns 부상 기록 데이터
 */
export async function fetchPlayerInjuries(playerId: number) {
  try {
    if (!playerId) {
      throw new Error('선수 ID가 필요합니다');
    }

    // 캐시 키 생성
    const cacheKey = `player_injuries_${playerId}`;
    
    // 캐시 확인
    const cachedData = injuriesCache.get(cacheKey);
    const now = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return cachedData.data;
    }
    
    // 현재 시즌과 이전 시즌 계산
    const currentYear = new Date().getFullYear();
    const seasons = [
      `${currentYear}`,
      `${currentYear-1}`,
      `${currentYear-2}`
    ];

    // 모든 시즌의 부상 데이터를 가져오기 위한 Promise 배열
    const injuryPromises = seasons.map(season => 
      fetch(
        `https://v3.football.api-sports.io/injuries?player=${playerId}&season=${season}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'force-cache'
        }
      )
    );

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
    responsesData.forEach(data => {
      if (data.response && data.response.length > 0) {
        allInjuries = [...allInjuries, ...data.response];
      }
    });

    // 부상 데이터 포맷팅
    const formattedInjuries = allInjuries.map((injury: ApiInjuryResponse) => {
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
        fixture: {
          date: injury.fixture.date,
        },
        league: {
          name: injury.league.name,
          season: injury.league.season,
        },
        team: {
          name: injury.team.name,
          logo: injury.team.logo,
        },
        type: mappedType,
        reason: mappedReason
      };
    });

    // 날짜 기준 내림차순 정렬
    const sortedInjuries = formattedInjuries.sort((a: Injury, b: Injury) => 
      new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
    );

    // 캐시에 결과 저장
    injuriesCache.set(cacheKey, {
      timestamp: now,
      data: sortedInjuries as Injury[]
    });

    return sortedInjuries as Injury[];

  } catch {
    return [] as Injury[];
  }
}

/**
 * 캐싱을 적용한 선수 부상 기록 가져오기
 */
export const fetchCachedPlayerInjuries = cache(fetchPlayerInjuries); 
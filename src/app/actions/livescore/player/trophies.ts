'use server';

import { cache } from 'react';

interface Trophy {
  league: string;
  country: string;
  place: string;
  season: string;
  leagueLogo: string | null;
}

// API 응답 데이터 인터페이스
interface TrophyResponse {
  league?: string | { 
    name?: string;
    logo?: string 
  };
  country?: string;
  place?: string;
  season?: string;
}

// 수상 결과 한글 매핑
const placeMap: { [key: string]: string } = {
  Winner: '우승',
  '2nd Place': '준우승',
  '3rd Place': '3위',
  'Runner-up': '준우승',
  'Semi-finals': '4강',
  'Quarter-finals': '8강',
  'Group Stage': '조별리그',
};

// 메모리 캐시 (서버 재시작될 때까지 유지)
const trophiesCache = new Map<string, {
  timestamp: number; 
  data: Trophy[];
}>();

// 리그 로고 캐시
const leagueLogosCache = new Map<string, string | null>();

// 캐시 유효 시간: 6시간 (단위: 밀리초)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * 특정 선수의 트로피 기록을 가져오는 서버 액션
 * @param playerId 선수 ID
 * @returns 트로피 기록 데이터
 */
export async function fetchPlayerTrophies(playerId: number): Promise<Trophy[]> {
  try {
    if (!playerId) {
      throw new Error('선수 ID가 필요합니다');
    }

    // 캐시 키 생성
    const cacheKey = `player_trophies_${playerId}`;
    
    // 캐시 확인
    const cachedData = trophiesCache.get(cacheKey);
    const now = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return cachedData.data;
    }

    // 1. 트로피 데이터 가져오기
    const trophiesResponse = await fetch(
      `https://v3.football.api-sports.io/trophies?player=${playerId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'force-cache'
      }
    );

    if (!trophiesResponse.ok) {
      throw new Error(`트로피 데이터 API 응답 오류: ${trophiesResponse.status}`);
    }

    const trophiesData = await trophiesResponse.json();

    if (!trophiesData.response || trophiesData.response.length === 0) {
      // 빈 결과 캐싱 (재요청 방지)
      trophiesCache.set(cacheKey, {
        timestamp: now,
        data: []
      });
      return [] as Trophy[];
    }

    // 2. 고유한 리그 목록 생성
    const uniqueLeagues = [...new Set(
      trophiesData.response
        .map((trophy: TrophyResponse) => {
          // league가 객체인지 문자열인지 확인
          if (typeof trophy.league === 'object' && trophy.league !== null) {
            return trophy.league.name;
          }
          return trophy.league;
        })
        .filter(Boolean) // undefined/null 제거
    )];
    
    // 3. 누락된 리그 로고만 가져오기 (캐시 확인)
    const logoFetchPromises = [];
    const leaguesToFetch: string[] = [];
    
    for (const leagueName of uniqueLeagues) {
      if (typeof leagueName === 'string' && !leagueLogosCache.has(leagueName)) {
        leaguesToFetch.push(leagueName);
        logoFetchPromises.push(
          fetch(
            `https://v3.football.api-sports.io/leagues?name=${encodeURIComponent(leagueName)}`,
            {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
              },
              cache: 'force-cache'
            }
          )
        );
      }
    }
    
    // 병렬로 리그 로고 정보 가져오기
    if (logoFetchPromises.length > 0) {
      const logoResponses = await Promise.all(logoFetchPromises);
      const logoResponsesData = await Promise.all(
        logoResponses.map(response => 
          response.ok ? response.json() : { response: [] }
        )
      );
      
      // 리그 로고 캐시 업데이트
      logoResponsesData.forEach((data, index) => {
        const leagueName = leaguesToFetch[index];
        if (data.response && data.response.length > 0) {
          const logo = data.response[0].league.logo;
          leagueLogosCache.set(leagueName, logo);
        } else {
          leagueLogosCache.set(leagueName, null);
        }
      });
    }

    // 5. 트로피 데이터 포맷팅
    const formattedTrophies = trophiesData.response.map((trophy: TrophyResponse) => {
      // league가 객체인지 문자열인지 확인
      let leagueName = '';
      let leagueLogo = null;
      
      if (typeof trophy.league === 'object' && trophy.league !== null) {
        // league가 객체인 경우 (API 응답 구조에 따라 다를 수 있음)
        leagueName = trophy.league.name || '';
        leagueLogo = trophy.league.logo || null;
      } else {
        // league가 문자열인 경우
        leagueName = trophy.league || '';
        // 리그 로고를 캐시에서 찾음
        leagueLogo = leagueLogosCache.get(leagueName) || null;
      }
      
      return {
        league: leagueName,
        country: trophy.country || '',
        place: placeMap[trophy.place || ''] || trophy.place || '',
        season: trophy.season || '',
        leagueLogo: leagueLogo
      };
    });
    
    // 시즌 기준 내림차순 정렬
    const sortedTrophies = formattedTrophies.sort((a: Trophy, b: Trophy) => 
      b.season.localeCompare(a.season)
    );

    // 캐시에 결과 저장
    trophiesCache.set(cacheKey, {
      timestamp: now,
      data: sortedTrophies
    });

    return sortedTrophies;

  } catch {
    return [] as Trophy[];
  }
}

/**
 * 캐싱을 적용한 선수 트로피 기록 가져오기
 */
export const fetchCachedPlayerTrophies = cache(fetchPlayerTrophies); 
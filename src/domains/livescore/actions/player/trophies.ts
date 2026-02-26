'use server';

import { cache } from 'react';
import { TrophyData } from '@/domains/livescore/types/player';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// API 응답 타입 정의
interface TrophyResponseItem {
  league?: string | { name?: string; logo?: string };
  country?: string;
  season?: string;
  place?: string;
}

/**
 * 선수 트로피 기록 가져오기
 * @param playerId 선수 ID
 * @returns 트로피 기록 목록
 */
export async function fetchPlayerTrophies(playerId: number): Promise<TrophyData[]> {
  try {
    if (!playerId) {
      return [];
    }

    // API 호출
    const data = await fetchFromFootballApi('trophies', { player: playerId });

    // 데이터 존재 확인
    if (!data.response || !Array.isArray(data.response)) {
      return [];
    }

    // 고유한 리그 이름 추출
    const uniqueLeagues = [...new Set<string>(
      data.response
        .map((trophy: TrophyResponseItem) => {
          if (typeof trophy.league === 'object' && trophy.league !== null) {
            return trophy.league.name || '';
          }
          return typeof trophy.league === 'string' ? trophy.league : '';
        })
        .filter((name: string) => name !== '')
    )];

    // 리그 로고 맵 생성
    const leagueLogosMap = new Map<string, string | null>();
    
    // 리그 로고 정보 가져오기
    const leagueLogoPromises = uniqueLeagues.map(async (leagueName: string) => {
      try {
        const logoData = await fetchFromFootballApi('leagues', { name: leagueName });
        if (logoData.response && logoData.response.length > 0) {
          leagueLogosMap.set(leagueName, logoData.response[0].league.logo);
        } else {
          leagueLogosMap.set(leagueName, null);
        }
      } catch (error) {
        console.error(`리그 로고 가져오기 오류 (${leagueName}):`, error);
        leagueLogosMap.set(leagueName, null);
      }
    });
    
    // 모든 리그 로고 요청 완료 대기
    await Promise.all(leagueLogoPromises);

    // 트로피 데이터 변환
    const trophies: TrophyData[] = data.response.map((trophy: TrophyResponseItem) => {
      // place 값 한글 번역
      let translatedPlace = trophy.place || '';
      
      // 영어 -> 한글 변환
      if (translatedPlace.toLowerCase() === 'winner' || 
          translatedPlace.toLowerCase() === 'gold' || 
          translatedPlace.toLowerCase() === 'champion' ||
          translatedPlace.toLowerCase() === '1st' ||
          translatedPlace.toLowerCase() === '1st place') {
        translatedPlace = '우승';
      } else if (translatedPlace.toLowerCase() === 'runner-up' || 
                 translatedPlace.toLowerCase() === 'silver' || 
                 translatedPlace.toLowerCase() === 'finalist' || 
                 translatedPlace.toLowerCase() === '2nd' ||
                 translatedPlace.toLowerCase() === '2nd place') {
        translatedPlace = '준우승';
      } else if (translatedPlace.toLowerCase() === '3rd' ||
                 translatedPlace.toLowerCase() === 'bronze' ||
                 translatedPlace.toLowerCase() === 'third place' ||
                 translatedPlace.toLowerCase() === '3rd place') {
        translatedPlace = '3위';
      } else if (translatedPlace.toLowerCase() === '4th' || 
                 translatedPlace.toLowerCase() === 'fourth place' ||
                 translatedPlace.toLowerCase() === '4th place') {
        translatedPlace = '4위';
      }
      
      // 리그 정보 처리
      let leagueName = '';
      let leagueLogo: string | null = null;
      
      if (typeof trophy.league === 'object' && trophy.league !== null) {
        // 객체인 경우 (API 응답이 객체 형태로 제공될 수 있음)
        leagueName = trophy.league.name || '';
        leagueLogo = trophy.league.logo || null;
      } else if (typeof trophy.league === 'string') {
        // 문자열인 경우
        leagueName = trophy.league;
        // 이전에 가져온 로고 사용
        leagueLogo = leagueLogosMap.get(leagueName) || null;
      }
      
      return {
        league: leagueName,
        country: trophy.country || '',
        season: trophy.season || '',
        place: translatedPlace,
        leagueLogo: leagueLogo,
      };
    });

    // 트로피 중복 제거
    const uniqueTrophies = trophies.filter((trophy, index, self) => {
      const key = `${trophy.league}-${trophy.country}-${trophy.season}-${trophy.place}`;
      return index === self.findIndex(t => 
        `${t.league}-${t.country}-${t.season}-${t.place}` === key
      );
    });

    // 최신 시즌 순으로 정렬
    return uniqueTrophies.sort((a, b) => {
      // 시즌 정보가 없으면 가장 오래된 것으로 간주
      if (!a.season) return 1;
      if (!b.season) return -1;

      // 시즌 시작 연도 추출 (예: "2019/2020" -> 2019)
      const getStartYear = (season: string) => {
        const year = parseInt(season.split('/')[0] || season);
        return isNaN(year) ? 0 : year;
      };

      // 최신 시즌이 먼저 오도록 내림차순 정렬
      return getStartYear(b.season) - getStartYear(a.season);
    });
  } catch (error) {
    console.error('선수 트로피 기록 가져오기 오류:', error);
    return [];
  }
}

// 캐싱 적용 함수
export const fetchCachedPlayerTrophies = cache(fetchPlayerTrophies); 
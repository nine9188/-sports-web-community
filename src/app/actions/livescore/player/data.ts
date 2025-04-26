'use server';

import { cache } from 'react';
import { PlayerData } from '@/app/livescore/football/player/types/player';
import { fetchPlayerData } from './player';

// API 호출 지연 시간 및 재시도 로직
const API_DELAY = 1000; // 1초 지연

/**
 * API 호출을 위한 재시도 함수
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>, 
  retries = 3, 
  delay = API_DELAY
): Promise<T> {
  try {
    // API 호출 간 지연 시간 적용
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await fetchFn();
  } catch (error: unknown) {
    // 429 (Too Many Requests) 오류이거나 다른 오류일 때 재시도
    if (retries > 0) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`API 요청 오류: ${errorMessage}. ${retries}회 재시도 남음. ${delay * 2}ms 후 재시도...`);
      // 지수 백오프 적용 (재시도마다 대기 시간 증가)
      return fetchWithRetry(fetchFn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * player.ts에서 구현된 fetchPlayerData 함수를 사용하여 
 * 선수 데이터를 가져오는 캐싱된 함수입니다.
 * 
 * 이 함수는 기존 API 호출 로직을 중복하지 않고 재사용하여
 * 코드 일관성과 유지보수성을 높입니다.
 * 
 * @param id 선수 ID
 * @returns 선수 데이터
 */
export const fetchCachedPlayerData = cache(async (id: string): Promise<PlayerData> => {
  try {
    console.log(`선수 ID ${id} 데이터 요청 중...`);
    
    // 재시도 로직을 적용한 API 호출
    const playerData = await fetchWithRetry(() => fetchPlayerData(id));
    console.log(`선수 ID ${id} 데이터 로드 완료`);
    
    return playerData;
  } catch (error) {
    console.error('선수 데이터 로딩 중 오류:', error);
    throw error;
  }
}); 
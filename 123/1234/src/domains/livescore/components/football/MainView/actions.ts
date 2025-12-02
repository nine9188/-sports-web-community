'use server';

import { getMajorLeagueIds } from '../../../constants/league-mappings';

// API 설정
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';

// 독립적인 API 호출 함수 (파란점 표시용)
async function fetchMatchesForDot(date: string): Promise<number> {
  try {
    const queryParams = new URLSearchParams({
      date,
      timezone: 'Asia/Seoul'
    });

    const url = `${API_BASE_URL}/fixtures?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();

    if (data.response) {
      const majorLeagueIds = getMajorLeagueIds();
      type ApiMatchMinimal = { league?: { id?: number | null } | null };
      const matchCount = data.response.filter((match: ApiMatchMinimal) =>
        majorLeagueIds.includes(match.league?.id ?? 0)
      ).length;

      return matchCount;
    }

    return 0;
  } catch {
    return 0;
  }
}

// 배치 처리 헬퍼 함수
async function processBatch(dates: string[], batchSize: number = 10): Promise<string[]> {
  const allResults: string[] = [];

  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);

    const promises = batch.map(async (dateStr: string) => {
      try {
        const matchCount = await fetchMatchesForDot(dateStr);
        if (matchCount > 0) {
          return dateStr;
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    const validDates = results
      .filter((result): result is PromiseFulfilledResult<string> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    allResults.push(...validDates);

    // 배치 간 약간의 지연 (API 안정성)
    if (i + batchSize < dates.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return allResults;
}

// 한 달치 경기가 있는 날짜만 반환 (배치 처리)
export async function fetchMonthMatchDates(year: number, month: number): Promise<string[]> {
  try {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 모든 날짜 문자열 생성
    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });

    // 배치 처리 (10개씩 - 31일이면 4번 배치)
    const validDates = await processBatch(allDates, 10);

    return validDates;
  } catch (error) {
    console.error(`[Server] Fatal error in fetchMonthMatchDates:`, error);
    return [];
  }
}

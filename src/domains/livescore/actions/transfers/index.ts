'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { 
  parseTransferFee, 
  sortTransfersByDate, 
  calculateTransferStats, 
  getLeagueName,
  TransferStats 
} from '../../utils/transferUtils';

// 이적 데이터 타입 정의
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

// 팀별 이적 정보 타입
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

// 리그별 이적 정보 필터 타입
export interface TransferFilters {
  league?: number;
  team?: number;
  season?: number;
  type?: 'in' | 'out' | 'all';
}

// API 응답 타입 정의
interface ApiTransferResponse {
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  player?: {
    id: number;
    name: string;
    photo: string;
    age: number;
    nationality: string;
  };
  update?: string;
  transfers?: Array<{
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
 * 팀별 이적 정보 가져오기
 * @param teamId 팀 ID
 * @param season 시즌 (클라이언트 사이드 필터링용, API에서는 사용 안함)
 * @returns 팀의 영입/방출 이적 정보
 */
export const fetchTeamTransfers = cache(async (
  teamId: number, 
  season?: number
): Promise<TeamTransfersData | null> => {
  try {
    if (!teamId) {
      return null;
    }

    console.log(`🔍 API 호출: team=${teamId}, season=${season || 'all'}`);
    
    // 캐싱된 API 호출 함수
    const cachedApiCall = unstable_cache(
      async (teamId: number) => {
        const response = await fetch(`https://v3.football.api-sports.io/transfers?team=${teamId}`, {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          next: { revalidate: 3600 } // 1시간 캐시
        });

        if (!response.ok) {
          throw new Error(`API 응답 오류: ${response.status}`);
        }

        return response.json();
      },
      [`team-transfers-${teamId}`],
      {
        revalidate: 3600, // 1시간
        tags: [`team-transfers`, `team-${teamId}`]
      }
    );

    const data = await cachedApiCall(teamId);
    console.log(`📊 원본 API 응답:`, {
      total: data.response?.length || 0,
      results: data.results || 0,
      paging: data.paging || {},
      errors: data.errors || []
    });

    // 상세 로깅: 첫 3개 선수 정보 확인
    if (data.response && data.response.length > 0) {
      console.log(`🔍 첫 3개 선수 샘플:`, data.response.slice(0, 3).map((player: ApiTransferResponse) => ({
        id: player.player?.id,
        name: player.player?.name,
        transfersCount: player.transfers?.length || 0,
        firstTransfer: player.transfers?.[0] ? {
          date: player.transfers[0].date,
          type: player.transfers[0].type,
          from: player.transfers[0].teams?.out?.name,
          to: player.transfers[0].teams?.in?.name
        } : null
      })));
    }

    // player/transfers.ts와 동일한 검증 로직
    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      console.log('❌ 응답 데이터가 비어있음 - 정상적인 경우일 수 있음');
      return {
        team: { id: teamId, name: '', logo: '' },
        transfers: { in: [], out: [] }
      };
    }

    // 데이터 처리 (시즌 필터링 제거됨)
    return processTeamTransferData(data, teamId);

  } catch (error) {
    console.error('팀 이적 정보 가져오기 오류:', error);
      return null;
    }
});

/**
 * 시즌별 이적 데이터 필터링 (관대한 필터링 - 최근 3년 포함)
 */
// 시즌별 이적 필터링 함수 (사용 중지됨 - 모든 이적 데이터 표시)
// function filterTransfersBySeason(transfers: ApiTransferResponse[], season?: number): ApiTransferResponse[] {
//   if (!season) return transfers;
//   
//   // 지정된 시즌이 없거나 최근 데이터가 부족한 경우, 최근 4년 데이터 포함
//   const currentYear = new Date().getFullYear();
//   const targetYears = [season, season - 1, season - 2, currentYear];
//   
//   return transfers.map(transfer => ({
//     ...transfer,
//     transfers: transfer.transfers?.filter(t => {
//       if (!t.date) return false;
//       const transferYear = new Date(t.date).getFullYear();
//       return targetYears.includes(transferYear);
//     }) || []
//   })).filter(transfer => transfer.transfers && transfer.transfers.length > 0);
// }

/**
 * 날짜 형식 검증 함수 (YYYY-MM-DD 형식만 허용)
 */
function isValidDateFormat(dateString: string): boolean {
  if (!dateString) return false;
  
  // YYYY-MM-DD 형식 정규식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // 실제 날짜 유효성 검증
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // 합리적인 범위 검증 (1990년 ~ 2030년)
  const year = date.getFullYear();
  if (year < 1990 || year > 2030) {
    return false;
  }
  
  return true;
}

/**
 * 팀 이적 데이터 처리 함수 (모든 이적 데이터 포함)
 */
function processTeamTransferData(
  data: { response: ApiTransferResponse[] }, 
  teamId: number
): TeamTransfersData {
  console.log(`🔄 데이터 처리 시작: ${data.response.length}명의 선수, 타겟팀=${teamId}`);
  
  // 시즌 필터링 제거 - 모든 이적 데이터 사용
  const filteredData = data.response;
  
  // 팀 정보
    const teamData = data.response[0];
  const teamInfo = teamData?.team || { id: teamId, name: '', logo: '' };
  console.log(`👕 팀 정보: ${teamInfo.name} (ID: ${teamInfo.id})`);
    
    // 영입/방출 분류
    const transfersIn: TransferMarketData[] = [];
    const transfersOut: TransferMarketData[] = [];

  filteredData.forEach((transfer: ApiTransferResponse) => {
      if (!transfer.transfers || !Array.isArray(transfer.transfers)) return;

    transfer.transfers.forEach((t) => {
        // 날짜 형식 검증 - YYYY-MM-DD 형식이 아니면 제외
        if (!isValidDateFormat(t.date || '')) {
          console.log(`❌ 날짜 형식 불량으로 제외: ${transfer.player?.name} - ${t.date}`);
          return;
        }

        const transferData: TransferMarketData = {
          player: {
            id: transfer.player?.id || 0,
            name: transfer.player?.name || '',
            photo: transfer.player?.photo || '',
            age: transfer.player?.age || 0,
            nationality: transfer.player?.nationality || ''
          },
          update: transfer.update || '',
          transfers: [{
            date: t.date || '',
            type: t.type || '',
            teams: {
              in: {
                id: t.teams?.in?.id || 0,
                name: t.teams?.in?.name || '',
                logo: t.teams?.in?.logo || ''
              },
              out: {
                id: t.teams?.out?.id || 0,
                name: t.teams?.out?.name || '',
                logo: t.teams?.out?.logo || ''
              }
            }
          }]
        };

        // 영입/방출 분류
        if (t.teams?.in?.id === teamId) {
          transfersIn.push(transferData);
          console.log(`📈 영입: ${transfer.player?.name} <- ${t.teams?.out?.name}`);
        } else if (t.teams?.out?.id === teamId) {
          transfersOut.push(transferData);
          console.log(`📉 방출: ${transfer.player?.name} -> ${t.teams?.in?.name}`);
        }
      });
    });

    console.log(`✅ 분류 완료: 영입 ${transfersIn.length}명, 방출 ${transfersOut.length}명`);

    return {
      team: {
        id: teamInfo.id,
        name: teamInfo.name,
        logo: teamInfo.logo
      },
      transfers: {
        in: sortTransfersByDate(transfersIn),
        out: sortTransfersByDate(transfersOut)
      }
    };
}

/**
 * 리그별 최신 이적 정보 가져오기
 * @param leagueId 리그 ID
 * @param season 시즌 (선택적, 미지정시 여러 시즌 시도)
 * @param limit 제한 수
 * @returns 리그의 최신 이적 정보
 */
export const fetchLeagueTransfers = cache(async (
  leagueId: number,
  season: number = 2025,
  limit: number = 50
): Promise<TransferMarketData[]> => {
  try {
    if (!leagueId) {
      return [];
    }

    // 리그 팀 목록 캐싱 (시즌별로 캐시)
    const cachedTeamsCall = unstable_cache(
      async (leagueId: number, season: number) => {
        const response = await fetch(
          `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`,
          {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
            },
            next: { revalidate: 7200 } // 2시간 캐시 (팀 정보는 더 오래 유지)
          }
        );

        if (!response.ok) {
          return null;
        }

        return response.json();
      },
      [`league-teams-${leagueId}-${season}`],
      {
        revalidate: 7200, // 2시간
        tags: [`league-teams`, `league-${leagueId}`, `season-${season}`]
      }
    );

    const teamsData = await cachedTeamsCall(leagueId, season);

    if (!teamsData) {
      return [];
    }

    if (!teamsData.response || !Array.isArray(teamsData.response) || teamsData.response.length === 0) {
      return [];
    }

    const allTransfers: TransferMarketData[] = [];

    // 더 많은 팀 처리 (12개)하여 데이터 누락 방지
    const teamIds = teamsData.response.slice(0, 12).map((team: { team: { id: number } }) => team.team.id);
    console.log(`📋 처리할 팀 목록: ${teamIds.join(', ')}`);
    
    const transferPromises = teamIds.map(async (teamId: number) => {
      try {
        const teamTransfers = await fetchTeamTransfers(teamId, season);
        if (teamTransfers) {
          return [...teamTransfers.transfers.in, ...teamTransfers.transfers.out];
        }
        return [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(transferPromises);
    results.forEach(transfers => allTransfers.push(...transfers));

    console.log(`✅ 리그 ${leagueId}에서 총 ${allTransfers.length}건의 이적 정보 수집`);

    // 최신 순으로 정렬하고 제한
    return allTransfers
      .sort((a, b) => new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime())
      .slice(0, limit);

  } catch (error) {
    console.log(`❌ fetchLeagueTransfers 에러:`, error);
    return [];
  }
});

/**
 * 선수별 이적 정보 가져오기
 * @param playerId 선수 ID
 * @returns 선수의 모든 이적 정보
 */
export const fetchPlayerTransfers = cache(async (playerId: number): Promise<TransferMarketData[]> => {
  try {
    if (!playerId) {
      return [];
    }

    const response = await fetch(`https://v3.football.api-sports.io/transfers?player=${playerId}`, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.response || !Array.isArray(data.response) || data.response.length === 0) {
      return [];
    }

    const transfers: TransferMarketData[] = [];

    data.response.forEach((transfer: ApiTransferResponse) => {
      if (!transfer.transfers || !Array.isArray(transfer.transfers)) return;

      transfer.transfers.forEach((t) => {
        // 날짜 형식 검증 - YYYY-MM-DD 형식이 아니면 제외
        if (!isValidDateFormat(t.date || '')) {
          return;
        }

        const transferData: TransferMarketData = {
          player: {
            id: transfer.player?.id || 0,
            name: transfer.player?.name || '',
            photo: transfer.player?.photo || '',
            age: transfer.player?.age || 0,
            nationality: transfer.player?.nationality || ''
          },
          update: transfer.update || '',
          transfers: [{
            date: t.date || '',
            type: t.type || '',
            teams: {
              in: {
                id: t.teams?.in?.id || 0,
                name: t.teams?.in?.name || '',
                logo: t.teams?.in?.logo || ''
              },
              out: {
                id: t.teams?.out?.id || 0,
                name: t.teams?.out?.name || '',
                logo: t.teams?.out?.logo || ''
              }
            }
          }]
        };

        transfers.push(transferData);
      });
    });

    // 최신 순으로 정렬
    return transfers.sort((a, b) => new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime());

  } catch {
    return [];
  }
});

/**
 * 최신 이적 소식을 종합적으로 가져오기 (팀 + 개별 선수 이적 정보 결합)
 * @param filters 필터 옵션
 * @param limit 제한 수
 * @returns 최신 이적 정보
 */
// 최신 이적 정보 캐싱 함수 - 동적 캐시 키 생성
const cachedFetchLatestTransfers = async (filters: TransferFilters = {}, limit: number = 30): Promise<TransferMarketData[]> => {
  // 캐시 키를 필터 기반으로 동적 생성
  const cacheKey = [
    'latest-transfers',
    `league-${filters.league || 'all'}`,
    `team-${filters.team || 'all'}`,
    `type-${filters.type || 'all'}`,
    `season-${filters.season || 2025}`,
    `limit-${limit}`
  ];

  console.log(`🔑 캐시 키: ${cacheKey.join('-')}`);

  const cachedFunction = unstable_cache(
    async (): Promise<TransferMarketData[]> => {
  try {
    // API 키 확인
    const API_KEY = process.env.FOOTBALL_API_KEY;
    if (!API_KEY) {
      return [];
    }

    // 시즌이 지정되지 않으면 2025 사용
    const targetSeason = filters.season || 2025;

    // 주요 리그 ID들 (프리미어리그, 라리가, 세리에A, 분데스리가, 리그1)
    const majorLeagues = [39, 140, 135, 78, 61];
    const targetLeague = filters.league || majorLeagues[0];

        // 특정 팀이 지정된 경우 - 순수 팀 이적 데이터만 사용
    if (filters.team) {
      console.log(`🎯 팀 이적 데이터 검색: teamId=${filters.team}`);

      // 팀 이적 API 호출
      const directTeamTransfers = await fetchTeamTransfers(filters.team, targetSeason);
      
      if (!directTeamTransfers) {
        return [];
      }

      let teamBasedTransfers: TransferMarketData[] = [];
      
      // 이적 유형에 따라 필터링
      if (filters.type === 'in') {
          teamBasedTransfers = directTeamTransfers.transfers.in;
      } else if (filters.type === 'out') {
          teamBasedTransfers = directTeamTransfers.transfers.out;
      } else {
        teamBasedTransfers = [...directTeamTransfers.transfers.in, ...directTeamTransfers.transfers.out];
      }

      console.log(`📊 팀 API 결과: ${teamBasedTransfers.length}건`);

      // 최신 순으로 정렬하고 제한
      return teamBasedTransfers
        .sort((a, b) => new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime())
        .slice(0, limit);
    }

    // 리그별 이적 정보 가져오기 (순수 API 기반)
    const result = await fetchLeagueTransfers(targetLeague, targetSeason, limit);
    
    // 중복 제거 및 정렬
    const uniqueTransfers = removeDuplicateTransfers(result);
    
    // 최신 순으로 정렬하고 제한
    return uniqueTransfers
      .sort((a, b) => new Date(b.transfers[0].date).getTime() - new Date(a.transfers[0].date).getTime())
      .slice(0, limit);

  } catch {
    return [];
  }
  },
    cacheKey,
  {
    revalidate: 1800, // 30분 캐시 (이적 정보는 자주 업데이트)
      tags: ['latest-transfers', `league-${filters.league}`, `team-${filters.team}`]
  }
);

  return await cachedFunction();
};

// 이적 정보 가져오기 함수
export const fetchLatestTransfers = cachedFetchLatestTransfers;



/**
 * 중복 이적 정보 제거
 * @param transfers 이적 정보 배열
 * @returns 중복 제거된 이적 정보
 */
function removeDuplicateTransfers(transfers: TransferMarketData[]): TransferMarketData[] {
  const seen = new Set<string>();
  
  return transfers.filter(transfer => {
    // 1. 기본 데이터 검증
    if (!transfer.player?.id || transfer.player.id <= 0 || !transfer.player?.name) {
      return false;
    }

    // 2. 이적 정보 필수 검증
    if (!transfer.transfers?.[0] || !transfer.transfers[0].date) {
      return false;
    }

    const transferData = transfer.transfers[0];

    // 3. 팀 정보 검증
    if (!transferData.teams?.in?.id || !transferData.teams?.out?.id) {
      return false;
    }

    // 4. 팀 이름 검증
    const teamInName = transferData.teams.in.name;
    const teamOutName = transferData.teams.out.name;
    
    if (!teamInName || !teamOutName) {
      return false;
    }

    // 5. 비정상적인 팀 이름 필터링
    // 팀 이름이 숫자로만 이루어져 있는 경우 제외
    if (/^[0-9]+$/.test(teamInName.trim()) || /^[0-9]+$/.test(teamOutName.trim())) {
      return false;
    }

    // 팀 이름이 "0"으로 시작하는 경우 제외
    if (teamInName.trim().startsWith('0') || teamOutName.trim().startsWith('0')) {
      return false;
    }

    // 팀 이름에 "0 " 또는 "==0" 포함된 경우 제외
    if (teamInName.includes('0 ') || teamOutName.includes('0 ') || 
        teamInName.includes('==0') || teamOutName.includes('==0')) {
      return false;
    }

    // 팀 이름이 너무 짧은 경우 제외
    if (teamInName.trim().length < 2 || teamOutName.trim().length < 2) {
      return false;
    }

    // 팀 ID가 0이거나 음수인 경우 제외
    if (transferData.teams.in.id <= 0 || transferData.teams.out.id <= 0) {
      return false;
    }

    // 6. 중복 제거 (선수 ID + 이적일 + 팀 조합으로 중복 판단)
    const key = `${transfer.player.id}-${transferData.date}-${transferData.teams.in.id}-${transferData.teams.out.id}`;
    
    if (seen.has(key)) {
      return false;
    }
    
    seen.add(key);
    return true;
  });
}

// 디버그 및 테스트 함수들 제거됨

// TransferStats 인터페이스는 utils에서 import됨

/**
 * 리그별 이적 데이터 체계적 정리
 */
export async function getOrganizedLeagueTransfers(
  leagueId: number,
  season?: number,
  sortBy: 'date' | 'value' | 'name' = 'date',
  limit: number = 50
): Promise<{
  league: { id: number; name: string };
  season: number | string;
  transfers: TransferMarketData[];
  stats: {
    totalTransfers: number;
    totalValue: number;
    topTransfers: TransferMarketData[];
  };
}> {
  try {
    const targetSeason = season || 2025;
    const transfers = await fetchLeagueTransfers(leagueId, targetSeason, limit);
    
    // 정렬 적용
    let sortedTransfers = [...transfers];
    
    switch (sortBy) {
      case 'value':
        sortedTransfers.sort((a, b) => {
          const valueA = parseTransferFee(a.transfers[0]?.type || '');
          const valueB = parseTransferFee(b.transfers[0]?.type || '');
          return valueB - valueA;
        });
        break;
      case 'name':
        sortedTransfers.sort((a, b) => a.player.name.localeCompare(b.player.name));
        break;
      default: // date
        sortedTransfers = sortTransfersByDate(sortedTransfers);
    }

    // 통계 계산
    const totalValue = transfers.reduce((sum, transfer) => {
      return sum + parseTransferFee(transfer.transfers[0]?.type || '');
    }, 0);

    const topTransfers = transfers
      .filter(t => parseTransferFee(t.transfers[0]?.type || '') > 0)
      .sort((a, b) => {
        const valueA = parseTransferFee(a.transfers[0]?.type || '');
        const valueB = parseTransferFee(b.transfers[0]?.type || '');
        return valueB - valueA;
      })
      .slice(0, 10);

    return {
      league: { 
        id: leagueId, 
        name: getLeagueName(leagueId) 
      },
      season: targetSeason,
      transfers: sortedTransfers,
      stats: {
        totalTransfers: transfers.length,
        totalValue,
        topTransfers
      }
    };

  } catch {
    return {
      league: { id: leagueId, name: 'Unknown' },
      season: season || 2025,
      transfers: [],
      stats: { totalTransfers: 0, totalValue: 0, topTransfers: [] }
    };
  }
}

// getLeagueName 함수는 utils에서 import됨

/**
 * 팀별 이적 데이터 상세 분석
 */
export async function getDetailedTeamTransfers(
  teamId: number,
  season?: number
): Promise<{
  team: { id: number; name: string; logo: string };
  season: number | string;
  transfers: TeamTransfersData['transfers'];
  stats: TransferStats;
  recentTransfers: TransferMarketData[];
  expensiveTransfers: TransferMarketData[];
}> {
  try {
    const targetSeason = season || 2025;
    const teamTransfers = await fetchTeamTransfers(teamId, targetSeason);
    
    if (!teamTransfers) {
      throw new Error('팀 이적 데이터를 찾을 수 없습니다');
    }

    const stats = calculateTransferStats(teamTransfers);
    const allTransfers = [...teamTransfers.transfers.in, ...teamTransfers.transfers.out];
    
    // 최근 이적 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentTransfers = allTransfers
      .filter(transfer => {
        const transferDate = new Date(transfer.transfers[0]?.date || '');
        return transferDate >= sixMonthsAgo;
      })
      .slice(0, 10);

    // 비싼 이적 (상위 10개)
    const expensiveTransfers = allTransfers
      .filter(transfer => parseTransferFee(transfer.transfers[0]?.type || '') > 0)
      .sort((a, b) => {
        const valueA = parseTransferFee(a.transfers[0]?.type || '');
        const valueB = parseTransferFee(b.transfers[0]?.type || '');
        return valueB - valueA;
      })
      .slice(0, 10);

    return {
      team: teamTransfers.team,
      season: targetSeason,
      transfers: teamTransfers.transfers,
      stats,
      recentTransfers,
      expensiveTransfers
    };

  } catch (error) {
    throw error;
  }
}

// 캐싱 적용
export const fetchCachedTeamTransfers = cache(fetchTeamTransfers);
export const fetchCachedLeagueTransfers = cache(fetchLeagueTransfers);
export const fetchCachedLatestTransfers = cache(fetchLatestTransfers);
export const getCachedOrganizedLeagueTransfers = cache(getOrganizedLeagueTransfers);
export const getCachedDetailedTeamTransfers = cache(getDetailedTeamTransfers);
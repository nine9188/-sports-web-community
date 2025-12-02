'use server';

import { MatchDataExtended, MatchEvent, StandingsData, Standing } from '../../types/match';
import { fetchCachedMatchData } from '../../utils/matchDataApi';
import { fetchMatchEvents } from './eventData';
import { fetchMatchLineups } from './lineupData';
import { fetchMatchStats } from './statsData';
import { fetchCachedLeagueStandings } from './standingsData';
import { TeamLineup } from './lineupData';
import { TeamStats } from './statsData';
// PlayerStats import 제거: 평점은 fetchPlayerRatings(), 풀 데이터는 fetchCachedPlayerStats() 사용
import { cache } from 'react';

// 매치 상세 데이터 응답 타입
export interface MatchFullDataResponse {
  success: boolean;
  match?: MatchDataExtended;
  events?: MatchEvent[];
  lineups?: {
    response: {
      home: TeamLineup;
      away: TeamLineup;
    } | null;
  };
  stats?: TeamStats[];
  standings?: StandingsData;
  // playersStats 제거: 평점은 fetchPlayerRatings(), 풀 데이터는 fetchCachedPlayerStats() 사용
  message?: string;
  error?: string;
  homeTeam?: { id: number; name: string; logo: string };
  awayTeam?: { id: number; name: string; logo: string };
  matchData?: Record<string, unknown>;
}

// 매치 전체 데이터 가져오기 (옵션에 따라 필요한 부분만)
export async function fetchMatchFullData(
  matchId: string, 
  options: {
    fetchEvents?: boolean;
    fetchLineups?: boolean;
    fetchStats?: boolean;
    fetchStandings?: boolean;
    // fetchPlayersStats 제거: 평점은 fetchPlayerRatings(), 풀 데이터는 fetchCachedPlayerStats() 사용
  } = {}
): Promise<MatchFullDataResponse> {
  try {
    // 기본 매치 정보는 항상 가져옴
    const matchData = await fetchCachedMatchData(matchId);
    
    if (!matchData.success || !matchData.data) {
      return {
        success: false,
        error: matchData.error || '매치 정보를 찾을 수 없습니다.'
      };
    }
    
    const data = matchData.data;
    
    // 응답 객체 초기화
    const response: MatchFullDataResponse = {
      success: true,
      match: {
        id: data.fixture.id,
        status: {
          code: data.fixture.status.short,
          name: data.fixture.status.long,
          elapsed: data.fixture.status.elapsed
        },
        time: {
          timestamp: data.fixture.timestamp,
          date: data.fixture.date,
          timezone: data.fixture.timezone || 'UTC'
        },
        league: {
          id: data.league.id,
          name: data.league.name,
          country: data.league.country,
          logo: data.league.logo,
          flag: data.league.flag
        },
        teams: {
          home: {
            id: data.teams.home.id,
            name: data.teams.home.name,
            logo: data.teams.home.logo,
            winner: data.teams.home.winner
          },
          away: {
            id: data.teams.away.id,
            name: data.teams.away.name,
            logo: data.teams.away.logo,
            winner: data.teams.away.winner
          }
        },
        goals: {
          home: data.goals.home || 0,
          away: data.goals.away || 0
        }
      },
      matchData: JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
      homeTeam: {
        id: data.teams.home.id,
        name: data.teams.home.name,
        logo: data.teams.home.logo
      },
      awayTeam: {
        id: data.teams.away.id,
        name: data.teams.away.name,
        logo: data.teams.away.logo
      }
    };
    
    // 옵션에 따라 추가 데이터 가져오기
    const promises = [];
    
    if (options.fetchEvents) {
      promises.push(
        fetchMatchEvents(matchId)
          .then(events => { 
            if (events.success && events.data) {
              response.events = events.data;
            }
          })
      );
    }
    
    if (options.fetchLineups) {
      promises.push(
        fetchMatchLineups(matchId)
          .then(async lineups => { 
            if (lineups.success && lineups.response) {
              response.lineups = {
                response: lineups.response
              };

              // 선수 통계 데이터는 더 이상 사전 로드하지 않음
              // - 평점: fetchPlayerRatings()로 경량 로드 (usePlayerStats 훅)
              // - 풀 데이터: fetchCachedPlayerStats()로 개별 로드 (모달 클릭 시)
            }
          })
      );
    }
    
    if (options.fetchStats) {
      promises.push(
        fetchMatchStats(matchId)
          .then(stats => { 
            if (stats.success && stats.response) {
              response.stats = stats.response;
            }
          })
      );
    }
    
    if (options.fetchStandings && response.match?.league?.id) {
      // 리그 ID와 시즌을 사용하여 순위 데이터 가져오기
      const season = data.league.season;
      promises.push(
        fetchCachedLeagueStandings(response.match.league.id, season)
          .then(standings => { 
            if (standings.success && standings.data && standings.data.league) {
              // 순위 데이터를 StandingsData 형식으로 변환하고 타입 안전성 확보
              const leagueData = standings.data.league;
              
              // 안전하게 타입 변환하기 위해 필수 필드 처리
              const transformedStandings: Standing[][] = [];
              
              if (leagueData.standings) {
                // 2차원 배열 변환
                leagueData.standings.forEach(standingGroup => {
                  const transformedGroup: Standing[] = [];
                  
                  standingGroup.forEach(item => {
                    if (item && item.rank !== undefined && item.team && 
                        item.team.id !== undefined && item.team.name !== undefined && 
                        item.team.logo !== undefined && item.points !== undefined && 
                        item.goalsDiff !== undefined && item.all) {
                      
                      // 타입 안전성 확보를 위한 타입 단언
                      const standing: Standing = {
                        rank: item.rank,
                        team: {
                          id: item.team.id,
                          name: item.team.name,
                          logo: item.team.logo
                        },
                        points: item.points,
                        goalsDiff: item.goalsDiff,
                        form: item.form,
                        description: item.description,
                        all: {
                          played: item.all.played ?? 0,
                          win: item.all.win ?? 0,
                          draw: item.all.draw ?? 0,
                          lose: item.all.lose ?? 0,
                          goals: {
                            for: item.all.goals?.for ?? 0,
                            against: item.all.goals?.against ?? 0
                          }
                        }
                      };
                      
                      transformedGroup.push(standing);
                    }
                  });
                  
                  if (transformedGroup.length > 0) {
                    transformedStandings.push(transformedGroup);
                  }
                });
              }
              
              response.standings = {
                standings: {
                  league: {
                    id: leagueData.id ?? 0,
                    name: leagueData.name ?? '',
                    logo: leagueData.logo ?? '',
                    name_ko: leagueData.name_ko ?? '',
                    season: leagueData.season,
                    standings: transformedStandings
                  }
                }
              };
            }
          })
      );
    }
    
    // 모든 데이터 가져오기 병렬 처리
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    return response;
  } catch (error) {
    console.error('매치 전체 데이터 로딩 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '매치 데이터를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

// 캐싱 적용 함수
export const fetchCachedMatchFullData = cache(fetchMatchFullData); 
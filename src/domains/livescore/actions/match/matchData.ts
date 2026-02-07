'use server';

import { MatchDataExtended, MatchEvent, StandingsData, Standing } from '../../types/match';
import { fetchCachedMatchData } from '../../utils/matchDataApi';
import { fetchMatchEvents } from './eventData';
import { fetchMatchLineups } from './lineupData';
import { fetchMatchStats } from './statsData';
import { fetchCachedLeagueStandings } from './standingsData';
import { TeamLineup } from './lineupData';
import { TeamStats } from './statsData';
import { getMatchCache, setMatchCache } from './matchCache';
// PlayerStats import 제거: 평점은 fetchPlayerRatings(), 풀 데이터는 fetchCachedPlayerStats() 사용
import { cache } from 'react';
// 4590 표준: 이미지 URL 함수
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';

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
  // 4590 표준: 서버에서 미리 조회한 팀 로고 Storage URL 맵
  teamLogoUrls?: Record<number, string>;
  // 4590 표준: 서버에서 미리 조회한 리그 로고 Storage URL
  leagueLogoUrl?: string;
  leagueLogoDarkUrl?: string;  // 다크모드 리그 로고
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
    const numericMatchId = parseInt(matchId, 10);

    // ============================================
    // L2 (Supabase) 캐시 확인 — 종료된 경기(FT) 영구 캐시
    // ============================================
    const cached = await getMatchCache(numericMatchId, 'full');
    if (cached) {
      const cachedResponse = cached as MatchFullDataResponse;

      // 캐시 데이터 완전성 검증: lineups, events, stats가 모두 있어야 캐시 사용
      const isCacheComplete =
        cachedResponse.lineups?.response &&
        cachedResponse.events && cachedResponse.events.length > 0 &&
        cachedResponse.stats && cachedResponse.stats.length > 0;

      // 불완전한 캐시는 무시하고 API에서 새로 가져옴
      if (!isCacheComplete) {
        console.log(`[MatchData] 불완전한 캐시 무시: ${matchId}`);
      } else {

      // standings는 실시간이므로 캐시에서 제외됨 → 필요하면 새로 가져옴
      if (options.fetchStandings && cachedResponse.match?.league?.id) {
        const season = (cachedResponse.matchData as Record<string, unknown>)?.league
          ? ((cachedResponse.matchData as Record<string, { season?: number }>).league?.season)
          : undefined;

        const standings = await fetchCachedLeagueStandings(
          cachedResponse.match.league.id,
          season
        );
        if (standings.success && standings.data?.league) {
          const leagueData = standings.data.league;
          const transformedStandings: Standing[][] = [];
          if (leagueData.standings) {
            leagueData.standings.forEach(standingGroup => {
              const transformedGroup: Standing[] = [];
              standingGroup.forEach(item => {
                if (item && item.rank !== undefined && item.team &&
                    item.team.id !== undefined && item.team.name !== undefined &&
                    item.team.logo !== undefined && item.points !== undefined &&
                    item.goalsDiff !== undefined && item.all) {
                  transformedGroup.push({
                    rank: item.rank,
                    team: { id: item.team.id, name: item.team.name, logo: item.team.logo },
                    points: item.points,
                    goalsDiff: item.goalsDiff,
                    form: item.form,
                    description: item.description,
                    all: {
                      played: item.all.played ?? 0, win: item.all.win ?? 0,
                      draw: item.all.draw ?? 0, lose: item.all.lose ?? 0,
                      goals: { for: item.all.goals?.for ?? 0, against: item.all.goals?.against ?? 0 }
                    }
                  });
                }
              });
              if (transformedGroup.length > 0) transformedStandings.push(transformedGroup);
            });
          }
          cachedResponse.standings = {
            standings: {
              league: {
                id: leagueData.id ?? 0, name: leagueData.name ?? '',
                logo: leagueData.logo ?? '', name_ko: leagueData.name_ko ?? '',
                season: leagueData.season, standings: transformedStandings
              }
            }
          };

          // 4590 표준: standings 팀 로고 URL 추가 조회
          const standingsTeamIds = new Set<number>();
          for (const group of transformedStandings) {
            for (const standing of group) {
              if (standing.team?.id) {
                standingsTeamIds.add(standing.team.id);
              }
            }
          }
          if (standingsTeamIds.size > 0) {
            const standingsLogoUrls = await getTeamLogoUrls(Array.from(standingsTeamIds));
            cachedResponse.teamLogoUrls = {
              ...cachedResponse.teamLogoUrls,
              ...standingsLogoUrls
            };
          }
        }
      }

        return cachedResponse;
      }
    }

    // ============================================
    // 캐시 미스 또는 불완전한 캐시 → API에서 가져오기
    // ============================================

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

    // 4590 표준: 리그 로고 URL 조회 (라이트 + 다크모드) - 병렬 처리에 포함
    if (response.match?.league?.id) {
      const leagueId = response.match.league.id;
      promises.push(
        Promise.all([
          getLeagueLogoUrl(leagueId),
          getLeagueLogoUrl(leagueId, true),  // 다크모드
        ]).then(([lightUrl, darkUrl]) => {
          response.leagueLogoUrl = lightUrl;
          response.leagueLogoDarkUrl = darkUrl;
        })
      );
    }

    // 모든 데이터 가져오기 병렬 처리 (standings 포함)
    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // 4590 표준: 팀 로고 URL 조회 (standings 완료 후 모든 팀 ID 수집)
    const teamIds = new Set<number>();
    // 홈/어웨이 팀
    if (response.homeTeam?.id) teamIds.add(response.homeTeam.id);
    if (response.awayTeam?.id) teamIds.add(response.awayTeam.id);
    // standings의 모든 팀
    if (response.standings?.standings?.league?.standings) {
      for (const group of response.standings.standings.league.standings) {
        for (const standing of group) {
          if (standing.team?.id) {
            teamIds.add(standing.team.id);
          }
        }
      }
    }
    // 팀 로고 URL 일괄 조회
    if (teamIds.size > 0) {
      response.teamLogoUrls = await getTeamLogoUrls(Array.from(teamIds));
    }

    // FT인 경우 L2 캐시에 저장 (standings 제외 — 실시간 데이터)
    // 단, 필수 데이터(lineups, events, stats)가 모두 있을 때만 캐시
    const hasCompleteData =
      response.lineups?.response &&
      response.events && response.events.length > 0 &&
      response.stats && response.stats.length > 0;

    if (response.match?.status?.code === 'FT' && hasCompleteData) {
      const cacheData = { ...response };
      delete cacheData.standings;
      setMatchCache(numericMatchId, 'full', cacheData).catch(() => {});
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
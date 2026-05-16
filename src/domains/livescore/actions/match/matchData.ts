'use server';

import { MatchDataExtended, MatchEvent, StandingsData, Standing } from '../../types/match';
import { fetchCachedMatchData } from '../../utils/matchDataApi';
import { fetchCachedMatchEvents } from './eventData';
import { fetchCachedMatchLineups } from './lineupData';
import { fetchCachedMatchStats } from './statsData';
import { fetchCachedLeagueStandings } from './standingsData';
import { TeamLineup } from './lineupData';
import { TeamStats } from './statsData';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
// 4590 표준: 이미지 URL 함수
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import { fetchCachedMatchShell, isFinishedMatchStatus, type MatchShell } from './matchShell';

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
function buildMatchFullDataFromShell(shell: MatchShell): MatchFullDataResponse {
  return {
    success: true,
    match: {
      id: shell.id,
      status: shell.status,
      time: shell.time,
      league: {
        id: shell.league.id,
        name: shell.league.name,
        country: shell.league.country,
        logo: shell.league.logo,
        flag: shell.league.flag,
      },
      teams: {
        home: {
          id: shell.teams.home.id,
          name: shell.teams.home.name,
          logo: shell.teams.home.logo,
          winner: shell.teams.home.winner,
        },
        away: {
          id: shell.teams.away.id,
          name: shell.teams.away.name,
          logo: shell.teams.away.logo,
          winner: shell.teams.away.winner,
        },
      },
      goals: {
        home: shell.goals.home ?? 0,
        away: shell.goals.away ?? 0,
      },
    },
    matchData: {
      fixture: {
        id: shell.id,
        date: shell.time.date,
        timestamp: shell.time.timestamp,
        timezone: shell.time.timezone,
        venue: shell.venue,
        status: {
          short: shell.status.code,
          long: shell.status.name,
          elapsed: shell.status.elapsed,
        },
      },
      league: {
        id: shell.league.id,
        name: shell.league.name,
        country: shell.league.country,
        season: shell.league.season,
        round: shell.league.round,
      },
      teams: shell.teams,
      goals: shell.goals,
    } as Record<string, unknown>,
    homeTeam: {
      id: shell.teams.home.id,
      name: shell.teams.home.name,
      logo: shell.teams.home.logo,
    },
    awayTeam: {
      id: shell.teams.away.id,
      name: shell.teams.away.name,
      logo: shell.teams.away.logo,
    },
    message: 'Match shell data loaded from fixture cache.',
  };
}

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
      const shellResult = await fetchCachedMatchShell(matchId);
      if (shellResult.status === 'found') {
        return buildMatchFullDataFromShell(shellResult.shell);
      }

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
        fetchCachedMatchEvents(matchId)
          .then(events => { 
            if (events.success && events.data) {
              response.events = events.data;
            }
          })
      );
    }
    
    if (options.fetchLineups) {
      promises.push(
        fetchCachedMatchLineups(matchId)
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
        fetchCachedMatchStats(matchId)
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
                        group: item.group,
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

    return response;
  } catch (error) {
    console.error('매치 전체 데이터 로딩 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '매치 데이터를 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 종료 경기: unstable_cache(영구) → API 최초 1회만 호출
 * 진행 중: React cache() → 같은 렌더 내 중복 제거 (revalidate는 fetchFromFootballApi가 관리)
 */
async function fetchMatchFullDataCached(
  matchId: string,
  options: Parameters<typeof fetchMatchFullData>[1] = {}
): Promise<MatchFullDataResponse> {
  // 먼저 경기 상태 확인 (가벼운 호출, fetchFromFootballApi의 revalidate 적용)
  const shellResult = await fetchCachedMatchShell(matchId);
  const statusCode = shellResult.status === 'found' ? shellResult.shell.status.code : '';

  if (isFinishedMatchStatus(statusCode) && !options.fetchEvents) {
    // options를 캐시 키에 포함 — generateMetadata(all false)가 풀 데이터 캐시를 오염시키는 버그 방지
    const optionsKey = [
      options.fetchEvents ? '1' : '0',
      options.fetchLineups ? '1' : '0',
      options.fetchStats ? '1' : '0',
      options.fetchStandings ? '1' : '0',
    ].join('');

    return unstable_cache(
      () => fetchMatchFullData(matchId, options),
      ['match-full', matchId, optionsKey],
      { revalidate: false, tags: [`match-${matchId}`] }
    )();
  }

  // 진행 중/예정: 캐싱 없이 실시간 데이터
  return fetchMatchFullData(matchId, options);
}

export const fetchCachedMatchFullData = cache(fetchMatchFullDataCached);

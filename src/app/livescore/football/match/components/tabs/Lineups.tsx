'use client';

import { useState, useEffect, Fragment, useCallback, useRef } from 'react';
import Image from 'next/image';
import Formation from './lineups/Formation';
import { TeamLineup } from '@/app/actions/livescore/matches/lineups';
import { getTeamById } from '@/app/constants';
import { LoadingState, ErrorState, EmptyState } from '@/app/livescore/football/components/CommonComponents';
// 아이콘 라이브러리 import 추가
import { FaFutbol, FaShoePrints } from 'react-icons/fa';
import { BsCardText, BsCardHeading } from 'react-icons/bs';
import { IoMdSwap } from 'react-icons/io';
// 프리미어리그 팀 선수 데이터 import - 직접적인 경로 사용
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/app/constants/teams/premier-league/premier-teams';
import { MatchEvent } from '../../types';
// 독립된 모달 컴포넌트 임포트
import PlayerStatsModal from './lineups/components/PlayerStatsModal';
import { PlayerStats, fetchCachedMultiplePlayerStats, MultiplePlayerStatsResponse } from '@/app/actions/livescore/matches/playerStats';

// TeamMapping 타입 정의 추가
interface TeamMapping {
  id: number;
  name_ko?: string;
  name_en?: string;
  name?: string;
  logo?: string;
}

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

interface LineupsProps {
  matchId: string;
  matchData?: {
    lineups?: {
      response: {
        home: TeamLineup;
        away: TeamLineup;
      } | null;
    };
    events?: MatchEvent[];
    homeTeam?: {
      id: number;
      name: string;
      logo: string;
    };
    awayTeam?: {
      id: number;
      name: string;
      logo: string;
    };
    playersStats?: Record<number, { response: PlayerStats[] }>;
  };
}

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

// 선수 이름 매핑 함수 수정
const getPlayerKoreanName = (playerId: number): string | null => {
  if (!playerId) return null;

  // ID 기반으로 선수 찾기 및 한국어 이름 반환 로직
  const findPlayerById = (players: PremierLeaguePlayer[]) => {
    return players.find(player => 'id' in player && player.id === playerId);
  };

  // 각 팀별로 찾기 (ID가 확실한 선수들만)
  const player = 
    findPlayerById(liverpoolPlayers as PremierLeaguePlayer[]) || 
    findPlayerById(Arsenalplayers as PremierLeaguePlayer[]) || 
    findPlayerById(NewcastleUnitedplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Chelseaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(ManchesterCityplayers as PremierLeaguePlayer[]) || 
    findPlayerById(AstonVillaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Bournemouthplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Fulhamplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Brightonplayers as PremierLeaguePlayer[]) ||
    findPlayerById(NottinghamForestPlayers as PremierLeaguePlayer[]);

  if (!player) return null;

  // 다양한 형태의 한국어 이름 속성 반환
  if ('koreanName' in player && player.koreanName) return player.koreanName;
  if ('korean_name' in player && player.korean_name) return player.korean_name;
  
  // 추가 속성 체크 (영어 이름과 함께 있는 경우)
  if ('english_name' in player && 'korean_name' in player) return player.korean_name;
  if ('englishName' in player && 'koreanName' in player) return player.koreanName;
  
  return null;
};

// 선수 이벤트 표시 컴포넌트
const PlayerEvents = ({ player, events }: { player: Player; events: MatchEvent[] }) => {
  if (!events || events.length === 0) return null;
  
  // 해당 선수의 이벤트 필터링 - 더 정확한 필터링
  const playerEvents = events.filter(event => {
    // ID가 없는 경우 필터링에서 제외
    if (!event?.player?.id && !event?.assist?.id) return false;
    
    // 교체 이벤트의 경우 특별 처리
    if (event.type === 'subst' || event.type === 'Substitution') {
      return event.player?.id === player.id || event.assist?.id === player.id;
    }
    
    // 일반 이벤트의 경우 기본 처리
    return event.player?.id === player.id || event.assist?.id === player.id;
  });
  
  if (playerEvents.length === 0) return null;
  
  return (
    <div className="inline-flex flex-wrap gap-1 ml-1">
      {playerEvents.map((event, index) => {
        if (!event) return null;
        
        // 이벤트 시간 포맷팅
        const timeStr = `${event.time.elapsed || '0'}'${event.time.extra ? '+' + event.time.extra : ''}`;
        
        // 이벤트 타입에 따른 아이콘 및 텍스트 렌더링
        if (event.type === 'Goal') {
          // 골 또는 어시스트
          if (event.player?.id === player.id) {
            // 골
            return (
              <span key={`goal-${index}`} className="inline-flex items-center text-xs bg-green-100 text-green-800 rounded px-1">
                <FaFutbol className="text-green-600 mr-0.5" />
                {timeStr}
              </span>
            );
          } else if (event.assist?.id === player.id) {
            // 어시스트
            return (
              <span key={`assist-${index}`} className="inline-flex items-center text-xs bg-blue-100 text-blue-800 rounded px-1">
                <FaShoePrints className="text-blue-600 mr-0.5" />
                {timeStr}
              </span>
            );
          }
        } else if (event.type === 'Card') {
          if (event.player?.id === player.id) {
            if (event.detail === 'Yellow Card') {
              // 옐로카드
              return (
                <span key={`yellow-${index}`} className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 rounded px-1">
                  <BsCardText className="text-yellow-500 mr-0.5" />
                  {timeStr}
                </span>
              );
            } else if (event.detail === 'Red Card') {
              // 레드카드
              return (
                <span key={`red-${index}`} className="inline-flex items-center text-xs bg-red-100 text-red-800 rounded px-1">
                  <BsCardHeading className="text-red-600 mr-0.5" />
                  {timeStr}
                </span>
              );
            }
          }
        } else if (event.type === 'subst' || event.type === 'Substitution') {
          // 교체 정보 매핑 수정 - API 응답에 따라 다른 구조일 수 있음
          let isIn = false;
          let isOut = false;
          
          // 교체 OUT은 player ID, 교체 IN은 assist ID에 해당
          // 선수가 나가는 경우 (player ID가 OUT 선수)
          if (event.assist?.id === player.id && (event.detail === 'Substitution Out' || event.detail?.includes('Out'))) {
            isOut = true;
          } 
          // 선수가 들어오는 경우 (assist ID가 IN 선수)
          else if (event.player?.id === player.id && (event.detail === 'Substitution In' || event.detail?.includes('In'))) {
            isIn = true;
          }
          
          // 이전 로직 백업 (일부 API는 다른 구조 사용)
          if (!isIn && !isOut) {
            // player가 교체 아웃, assist가 교체 투입 선수인 경우
            if (event.detail === 'Substitution' || event.detail?.includes('Substitution')) {
              if (event.player?.id === player.id) {
                isOut = true;
              } else if (event.assist?.id === player.id) {
                isIn = true;
              }
            }
          }
          
          if (isIn) {
            return (
              <span key={`in-${index}`} className="inline-flex items-center text-xs bg-green-100 text-green-800 rounded px-1">
                <IoMdSwap className="text-green-600 mr-0.5" />
                IN {timeStr}
              </span>
            );
          } else if (isOut) {
            return (
              <span key={`out-${index}`} className="inline-flex items-center text-xs bg-red-100 text-red-800 rounded px-1">
                <IoMdSwap className="text-red-600 mr-0.5 rotate-180" />
                OUT {timeStr}
              </span>
            );
          }
        }
        
        return null;
      })}
    </div>
  );
};

// 선수 이미지 컴포넌트 추가
const PlayerImage = ({ src, alt, className = "" }: { src: string | undefined; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [loading, setLoading] = useState(true);
  
  const handleError = () => {
    setImgSrc('/placeholder-player.png'); // 기본 이미지 경로
    setLoading(false);
  };
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  return (
    <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Image 
        src={imgSrc || '/placeholder-player.png'}
        alt={alt}
        width={40}
        height={40}
        className={`object-cover rounded-full ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        unoptimized
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default function Lineups({ matchId, matchData }: LineupsProps) {
  // 모든 useState Hook 선언
  const [loading, setLoading] = useState(!matchData?.lineups);
  const [lineups, setLineups] = useState<{home: TeamLineup; away: TeamLineup} | null>(
    matchData?.lineups?.response || null
  );
  const [events, setEvents] = useState<MatchEvent[]>(matchData?.events || []);
  const [error] = useState<string | null>(null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
    number: string;
    pos: string;
    team: {
      id: number;
      name: string;
    };
  } | null>(null);
  const [playersStatsData, setPlayersStatsData] = useState<MultiplePlayerStatsResponse>(
    matchData?.playersStats || {}
  );
  
  // 데이터 로드 여부를 추적하는 ref - 불필요한 재요청 방지
  const dataLoadedRef = useRef<{
    lineups: boolean;
    stats: boolean;
  }>({
    lineups: !!matchData?.lineups?.response,
    stats: !!matchData?.playersStats && Object.keys(matchData.playersStats).length > 0
  });

  // matchID 변경 추적을 위한 ref 추가
  const prevMatchIdRef = useRef<string | null>(null);

  // 포메이션 데이터를 가공하는 함수 (리렌더링 방지를 위해 useCallback 사용)
  const prepareFormationData = useCallback((teamLineup: TeamLineup) => {
    if (!teamLineup || !teamLineup.startXI) return null;
    
    return {
      team: {
        id: teamLineup.team.id,
        name: teamLineup.team.name,
        colors: teamLineup.team.colors || {
          player: {
            primary: '1a5f35',
            number: 'ffffff',
            border: '1a5f35'
          },
          goalkeeper: {
            primary: 'ffd700',
            number: '000000',
            border: 'ffd700'
          }
        }
      },
      formation: teamLineup.formation,
      startXI: teamLineup.startXI.map(item => {
        // API 응답에 따라 player가 직접 제공되거나 중첩 구조로 제공될 수 있음
        const playerData = 'player' in item ? item.player : item;
        return {
          id: playerData.id,
          name: playerData.name,
          number: playerData.number,
          pos: playerData.pos,
          grid: playerData.grid || '',
          captain: playerData.captain || false,
          photo: playerData.photo || ''
        };
      })
    };
  }, []);

  // 라인업 데이터에서 모든 선수 ID를 추출하는 함수
  const extractPlayerIds = useCallback((homeLineup: TeamLineup | null, awayLineup: TeamLineup | null) => {
    const playerIds: number[] = [];
    
    if (homeLineup) {
      // 출전 선수들
      if (homeLineup.startXI) {
        homeLineup.startXI.forEach(player => {
          if (player.player?.id) {
            playerIds.push(player.player.id);
          }
        });
      }
      
      // 교체 선수들
      if (homeLineup.substitutes) {
        homeLineup.substitutes.forEach(player => {
          if (player.player?.id) {
            playerIds.push(player.player.id);
          }
        });
      }
    }
    
    if (awayLineup) {
      // 출전 선수들
      if (awayLineup.startXI) {
        awayLineup.startXI.forEach(player => {
          if (player.player?.id) {
            playerIds.push(player.player.id);
          }
        });
      }
      
      // 교체 선수들
      if (awayLineup.substitutes) {
        awayLineup.substitutes.forEach(player => {
          if (player.player?.id) {
            playerIds.push(player.player.id);
          }
        });
      }
    }
    
    return playerIds;
  }, []);
  
  // 선수 통계 데이터 로드
  useEffect(() => {
    const loadPlayersStats = async () => {
      // 이미 통계 데이터가 로드되었으면 스킵
      if (dataLoadedRef.current.stats || !lineups || !matchId) return;
      
      // 캐시 키 생성 (경기 ID 기반)
      const cacheKey = `match-${matchId}-players-stats`;
      
      // 세션 스토리지에서 캐시된 데이터 확인
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setPlayersStatsData(parsedData);
          dataLoadedRef.current.stats = true;
          return;
        }
      } catch (error) {
        // 캐시 파싱 오류 무시하고 계속 진행
        console.error('캐시 데이터 파싱 오류:', error);
      }
      
      // 이미 충분한 통계 데이터가 있는지 확인
      const playerIds = extractPlayerIds(lineups.home, lineups.away);
      if (playerIds.length === 0) return;

      const existingStatsCount = Object.keys(playersStatsData || {}).length;
      if (existingStatsCount >= playerIds.length) {
        dataLoadedRef.current.stats = true;
        return;
      }
      
      try {
        // 아직 로드되지 않은 선수 ID만 필터링
        const missingPlayerIds = playerIds.filter(id => 
          !playersStatsData || !playersStatsData[id]
        );
        
        if (missingPlayerIds.length === 0) {
          dataLoadedRef.current.stats = true;
          return;
        }
        
        const stats = await fetchCachedMultiplePlayerStats(matchId, missingPlayerIds);
        
        // 새 데이터와 기존 데이터 병합
        const mergedStats = {
          ...playersStatsData,
          ...stats
        };
        
        setPlayersStatsData(mergedStats);
        dataLoadedRef.current.stats = true;
        
        // 세션 스토리지에 데이터 캐싱
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(mergedStats));
        } catch (err) {
          // 스토리지 용량 초과 등의 오류 무시
          console.error('세션 스토리지 캐싱 오류:', err);
        }
      } catch (error) {
        // 오류 시 처리
        console.error('선수 통계 로드 오류:', error);
      }
    };
    
    loadPlayersStats();
  }, [matchId, lineups, extractPlayerIds, playersStatsData]);

  // matchData prop이 변경될 때 상태 업데이트
  useEffect(() => {
    // 이미 로드된 데이터가 있고, matchId가 변경되지 않았다면 재로드하지 않음
    if (dataLoadedRef.current.lineups && matchId === prevMatchIdRef.current) {
      return;
    }
    
    // 현재 matchId 저장
    prevMatchIdRef.current = matchId;
    
    if (matchData) {
      // 라인업 데이터 설정
      if (matchData.lineups?.response) {
        setLineups(matchData.lineups.response);
        setLoading(false);
        dataLoadedRef.current.lineups = true;
      }
      
      // 이벤트 데이터 설정
      if (matchData.events) {
        setEvents(matchData.events);
      }
      
      // 선수 통계 데이터 설정
      if (matchData.playersStats && Object.keys(matchData.playersStats).length > 0) {
        setPlayersStatsData(prevStats => {
          // 새 데이터가 있는 경우에만 업데이트
          if (Object.keys(matchData.playersStats || {}).length > Object.keys(prevStats || {}).length) {
            const mergedStats = { ...prevStats, ...matchData.playersStats };
            if (Object.keys(mergedStats).length > 0) {
              dataLoadedRef.current.stats = true;
            }
            return mergedStats;
          }
          return prevStats;
        });
      }
    }
  }, [matchId, matchData]);
  
  // 팀 정보 캐싱을 위한 hook
  useEffect(() => {
    const homeTeam = matchData?.homeTeam;
    const awayTeam = matchData?.awayTeam;
    
    // 홈팀과 원정팀 ID를 확인
    const teamIds = new Set<number>();
    if (homeTeam?.id) teamIds.add(homeTeam.id);
    if (awayTeam?.id) teamIds.add(awayTeam.id);

    // 아직 캐시에 없는 팀 정보 추가
    const newTeamCache = { ...teamCache };
    let cacheUpdated = false;

    teamIds.forEach(teamId => {
      if (!newTeamCache[teamId]) {
        const teamInfo = getTeamById(teamId);
        if (teamInfo) {
          newTeamCache[teamId] = teamInfo;
          cacheUpdated = true;
        }
      }
    });

    // 캐시가 업데이트되었을 때만 상태 업데이트
    if (cacheUpdated) {
      setTeamCache(newTeamCache);
    }
  }, [matchData?.homeTeam, matchData?.awayTeam, teamCache]);
  
  // 선수 클릭 핸들러
  const handlePlayerClick = (player: Player, teamId: number, teamName: string) => {
    setSelectedPlayer({
      id: player.id,
      name: player.name,
      number: player.number.toString(),
      pos: player.pos || '',
      team: {
        id: teamId,
        name: teamName
      }
    });
    setIsModalOpen(true);
  };
  
  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 로딩 중이면 로딩 표시
  if (loading) {
    return <LoadingState message="라인업 데이터를 불러오는 중..." />;
  }
  
  // 오류 표시
  if (error) {
    return <ErrorState message={error} />;
  }

  // 라인업 데이터가 없는 경우 처리
  if (!lineups) {
    return <EmptyState title="라인업 정보가 없습니다" message="현재 이 경기에 대한 라인업 정보를 제공할 수 없습니다." />;
  }

  const homeTeam = matchData?.homeTeam || { id: 0, name: '홈팀', logo: '/placeholder-team.png' };
  const awayTeam = matchData?.awayTeam || { id: 0, name: '원정팀', logo: '/placeholder-team.png' };
  const homeLineup = lineups.home;
  const awayLineup = lineups.away;
  
  // 포메이션 데이터 준비 (useCallback으로 정의된 함수 사용)
  const homeFormationData = prepareFormationData(homeLineup);
  const awayFormationData = prepareFormationData(awayLineup);
  
  // 팀 이름 표시 개선 함수
  const getTeamDisplayName = (id: number, fallbackName: string): string => {
    const cachedTeam = teamCache[id];
    return cachedTeam?.name_ko || fallbackName;
  };

  // 팀 로고 URL 가져오는 함수
  const getTeamLogoUrl = (id: number, fallbackLogo: string): string => {
    const cachedTeam = teamCache[id];
    return cachedTeam?.logo || fallbackLogo;
  };
  
  return (
    <div>
      {/* 포메이션 시각화 - 제일 상단에 배치 */}
      {(homeFormationData && awayFormationData) && (
        <div className="mb-4">
          <Formation 
            homeTeamData={homeFormationData} 
            awayTeamData={awayFormationData} 
          />
        </div>
      )}
      
      {/* 통합된 테이블 구조 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 border-r border-gray-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={getTeamLogoUrl(homeTeam.id, homeTeam.logo)}
                      alt={`${getTeamDisplayName(homeTeam.id, homeTeam.name)} 로고`}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-medium">{getTeamDisplayName(homeTeam.id, homeTeam.name)}</span>
                </div>
                <div className="text-xs text-gray-500">포메이션: {homeLineup.formation}</div>
              </th>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={getTeamLogoUrl(awayTeam.id, awayTeam.logo)}
                      alt={`${getTeamDisplayName(awayTeam.id, awayTeam.name)} 로고`}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="font-medium">{getTeamDisplayName(awayTeam.id, awayTeam.name)}</span>
                </div>
                <div className="text-xs text-gray-500">포메이션: {awayLineup.formation}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {/* 섹션 제목: 선발 라인업 - 색상 제거 */}
            <tr>
              <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                선발 라인업
              </td>
            </tr>
            
            {/* 선발 라인업 행 생성 - 최대 11명 */}
            {Array.from({ length: Math.max(
              homeLineup.startXI?.length || 0, 
              awayLineup.startXI?.length || 0
            ) }).map((_, index) => (
              <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {homeLineup.startXI && index < homeLineup.startXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        homeLineup.startXI[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.startXI[index].player.photo ? (
                          <PlayerImage 
                            src={homeLineup.startXI[index].player.photo}
                            alt={`${homeLineup.startXI[index].player.name} 선수 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            {homeLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {homeLineup.startXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(homeLineup.startXI[index].player.id) || homeLineup.startXI[index].player.name}
                          {homeLineup.startXI[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {homeLineup.startXI[index].player.pos || '-'} {homeLineup.startXI[index].player.number}
                          <PlayerEvents player={homeLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {awayLineup.startXI && index < awayLineup.startXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        awayLineup.startXI[index].player, 
                        awayTeam.id, 
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.startXI[index].player.photo ? (
                          <PlayerImage 
                            src={awayLineup.startXI[index].player.photo}
                            alt={`${awayLineup.startXI[index].player.name} 선수 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            {awayLineup.startXI[index].player.number || '-'}
                          </div>
                        )}
                        {awayLineup.startXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(awayLineup.startXI[index].player.id) || awayLineup.startXI[index].player.name}
                          {awayLineup.startXI[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {awayLineup.startXI[index].player.pos || '-'} {awayLineup.startXI[index].player.number}
                          <PlayerEvents player={awayLineup.startXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* 섹션 제목: 교체 선수 - 색상 제거 */}
            <tr>
              <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                교체 선수
              </td>
            </tr>
            
            {/* 교체 선수 행 생성 - PlayerImage 컴포넌트 사용 */}
            {Array.from({ length: Math.max(
              homeLineup.substitutes?.length || 0, 
              awayLineup.substitutes?.length || 0
            ) }).map((_, index) => (
              <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {homeLineup.substitutes && index < homeLineup.substitutes.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        homeLineup.substitutes[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {homeLineup.substitutes[index].player.photo ? (
                          <PlayerImage 
                            src={homeLineup.substitutes[index].player.photo}
                            alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            {homeLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {homeLineup.substitutes[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(homeLineup.substitutes[index].player.id) || homeLineup.substitutes[index].player.name}
                          {homeLineup.substitutes[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {homeLineup.substitutes[index].player.pos || '-'} {homeLineup.substitutes[index].player.number}
                          <PlayerEvents player={homeLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {awayLineup.substitutes && index < awayLineup.substitutes.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        awayLineup.substitutes[index].player, 
                        awayTeam.id, 
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {awayLineup.substitutes[index].player.photo ? (
                          <PlayerImage 
                            src={awayLineup.substitutes[index].player.photo}
                            alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            {awayLineup.substitutes[index].player.number || '-'}
                          </div>
                        )}
                        {awayLineup.substitutes[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {/* 선수 한국어 이름 매핑 */}
                          {getPlayerKoreanName(awayLineup.substitutes[index].player.id) || awayLineup.substitutes[index].player.name}
                          {awayLineup.substitutes[index].player.captain && (
                            <span className="ml-1 text-xs text-yellow-600 font-semibold">(주장)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {awayLineup.substitutes[index].player.pos || '-'} {awayLineup.substitutes[index].player.number}
                          <PlayerEvents player={awayLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {/* 섹션 제목: 감독 - 색상 제거 */}
            {homeLineup.coach && awayLineup.coach && homeLineup.coach.name && awayLineup.coach.name && (
              <>
                <tr>
                  <td colSpan={2} className="py-2 px-4 bg-gray-100 text-gray-700 font-bold">
                    감독
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-r border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {homeLineup.coach?.photo ? (
                          <PlayerImage 
                            src={homeLineup.coach.photo}
                            alt={`${homeLineup.coach.name} 감독 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="감독 기본 아이콘">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{homeLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500">감독</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {awayLineup.coach?.photo ? (
                          <PlayerImage 
                            src={awayLineup.coach.photo}
                            alt={`${awayLineup.coach.name} 감독 사진`}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100 rounded-full border-2 border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="감독 기본 아이콘">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{awayLineup.coach?.name || '정보 없음'}</div>
                        <div className="text-xs text-gray-500">감독</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 선수 통계 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          matchId={matchId}
          playerInfo={{
            name: getPlayerKoreanName(selectedPlayer.id) || selectedPlayer.name, // 한국어 이름 적용
            number: selectedPlayer.number,
            pos: selectedPlayer.pos,
            team: {
              id: selectedPlayer.team.id,
              name: getTeamDisplayName(selectedPlayer.team.id, selectedPlayer.team.name)
            }
          }}
          preloadedStats={playersStatsData[selectedPlayer.id]}
        />
      )}
    </div>
  );
} 
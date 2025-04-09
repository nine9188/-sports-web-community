'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IoMdSwap } from 'react-icons/io';
import { BsCardText, BsCardHeading } from 'react-icons/bs';
import { FaFutbol, FaShoePrints } from 'react-icons/fa';
import Formation from './lineups/Formation';
import PlayerStatsModal from './lineups/components/PlayerStatsModal';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

interface Coach {
  id: number;
  name: string;
  photo: string;
}

interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: {
        primary: string;
        number: string;
        border: string;
      };
      goalkeeper: {
        primary: string;
        number: string;
        border: string;
      };
    };
  };
  formation: string;
  startXI: Array<{
    player: Player;
  }>;
  substitutes: Array<{
    player: Player;
  }>;
  coach: Coach;
}

// PlayerStatsData 인터페이스 추가
interface PlayerStatsData {
  response: Array<{
    player: {
      id: number;
      name: string;
      photo?: string;
    };
    statistics: Array<{
      team?: {
        logo: string;
        name: string;
      };
      games?: {
        rating: string;
        minutes: number;
        captain: boolean;
      };
      goals?: {
        total: number;
        assists: number;
        conceded?: number;
        saves?: number;
      };
      shots?: {
        total: number;
        on: number;
      };
      passes?: {
        total: number;
        key: number;
        accuracy: string;
      };
      tackles?: {
        total: number;
        blocks: number;
        interceptions: number;
      };
      duels?: {
        total: number;
        won: number;
      };
      dribbles?: {
        attempts: number;
        success: number;
      };
      fouls?: {
        drawn: number;
        committed: number;
      };
      cards?: {
        yellow: number;
        red: number;
      };
      penalty?: {
        won: number;
        scored: number;
        missed: number;
        saved: number;
      };
    }>;
  }>;
}

interface LineupsProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  lineups: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  events?: MatchEvent[];
  playersStatsData?: Record<number, PlayerStatsData>;
  matchId?: number;
}

interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
}

// 선수 이벤트 표시 컴포넌트
const PlayerEvents = ({ player, events }: { player: Player; events: MatchEvent[] }) => {
  if (!events || events.length === 0) return null;
  
  // 해당 선수의 이벤트 필터링
  const playerEvents = events.filter(event => 
    event.player?.id === player.id || 
    event.assist?.id === player.id
  );
  
  if (playerEvents.length === 0) return null;
  
  return (
    <div className="inline-flex flex-wrap gap-1 ml-1">
      {playerEvents.map((event, index) => {
        // 이벤트 시간 포맷팅
        const timeStr = `${event.time.elapsed}'${event.time.extra ? '+' + event.time.extra : ''}`;
        
        // 이벤트 타입에 따른 아이콘 및 텍스트 렌더링
        if (event.type === 'Goal') {
          // 골 또는 어시스트
          if (event.player?.id === player.id) {
            // 골
            return (
              <span key={index} className="inline-flex items-center text-xs bg-green-100 text-green-800 rounded px-1">
                <FaFutbol className="text-green-600 mr-0.5" />
                {timeStr}
              </span>
            );
          } else if (event.assist?.id === player.id) {
            // 어시스트
            return (
              <span key={index} className="inline-flex items-center text-xs bg-blue-100 text-blue-800 rounded px-1">
                <FaShoePrints className="text-blue-600 mr-0.5" />
                {timeStr}
              </span>
            );
          }
        } else if (event.type === 'Card') {
          if (event.detail === 'Yellow Card') {
            // 옐로카드
            return (
              <span key={index} className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 rounded px-1">
                <BsCardText className="text-yellow-500 mr-0.5" />
                {timeStr}
              </span>
            );
          } else {
            // 레드카드
            return (
              <span key={index} className="inline-flex items-center text-xs bg-red-100 text-red-800 rounded px-1">
                <BsCardHeading className="text-red-600 mr-0.5" />
                {timeStr}
              </span>
            );
          }
        } else if (event.type === 'subst') {
          // 교체
          const isIn = event.detail === 'Substitution In' || event.player?.id === player.id;
          const isOut = event.detail === 'Substitution Out' || event.assist?.id === player.id;
          
          if (isIn) {
            return (
              <span key={index} className="inline-flex items-center text-xs bg-emerald-100 text-emerald-800 rounded px-1">
                <IoMdSwap className="text-emerald-600 mr-0.5" />
                IN {timeStr}
              </span>
            );
          } else if (isOut) {
            return (
              <span key={index} className="inline-flex items-center text-xs bg-gray-100 text-gray-800 rounded px-1">
                <IoMdSwap className="text-gray-600 mr-0.5 rotate-180" />
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

// 데이터 변환 함수 수정
const transformLineupData = (lineup: TeamLineup): TeamLineup => {
  if (!lineup) return lineup;
  
  return {
    ...lineup,
    startXI: lineup.startXI?.map((item) => {
      // API 응답에 따라 player가 직접 제공되거나 중첩 구조로 제공될 수 있음
      const playerData = 'player' in item ? item.player : item;
      return {
        player: {
          id: playerData.id,
          name: playerData.name,
          number: playerData.number,
          pos: playerData.pos,
          grid: playerData.grid || '',
          captain: playerData.captain,
          photo: playerData.photo
        }
      };
    }) || [],
    substitutes: lineup.substitutes?.map((item) => {
      // API 응답에 따라 player가 직접 제공되거나 중첩 구조로 제공될 수 있음
      const playerData = 'player' in item ? item.player : item;
      return {
        player: {
          id: playerData.id,
          name: playerData.name,
          number: playerData.number,
          pos: playerData.pos,
          grid: playerData.grid || '',
          captain: playerData.captain,
          photo: playerData.photo
        }
      };
    }) || []
  };
};

export default function Lineups({ 
  homeTeam, 
  awayTeam, 
  lineups, 
  events = [],
  playersStatsData = {},
  matchId
}: LineupsProps) {
  // 모달 상태 관리
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

  // 배열 형태로 전달된 경우 객체 형태로 변환
  let formattedLineups = lineups;
  if (Array.isArray(lineups)) {
    const homeLineup = lineups.find(lineup => lineup.team.id === homeTeam?.id);
    const awayLineup = lineups.find(lineup => lineup.team.id === awayTeam?.id);
    
    if (homeLineup && awayLineup) {
      formattedLineups = {
        home: homeLineup,
        away: awayLineup
      };
    } else {
      formattedLineups = null;
    }
  }
  
  // 데이터 변환 로직 수정
  if (formattedLineups) {
    try {
      const tempHome = transformLineupData(formattedLineups.home);
      const tempAway = transformLineupData(formattedLineups.away);
      
      formattedLineups = {
        home: tempHome,
        away: tempAway
      };
    } catch (error) {
      console.error('라인업 데이터 구조 변환 중 오류:', error);
    }
  }
  
  if (!formattedLineups) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">라인업 정보가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">현재 이 경기에 대한 라인업 정보를 제공할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-1">API에서 라인업 데이터를 가져오지 못했습니다.</p>
        </div>
      </div>
    );
  }

  const homeLineup = formattedLineups.home;
  const awayLineup = formattedLineups.away;
  // 사용하지 않는 변수 주석 처리
  // const homeColor = 'bg-blue-600';
  // const awayColor = 'bg-red-600';
  
  // 홈팀 또는 원정팀 라인업이 없는 경우 처리
  if (!homeLineup || !awayLineup) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">라인업 정보가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">현재 이 경기에 대한 라인업 정보를 제공할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-1">API에서 라인업 데이터를 가져오지 못했습니다.</p>
        </div>
      </div>
    );
  }
  
  // startXI가 없거나 비어있는 경우 처리
  if (!homeLineup.startXI || homeLineup.startXI.length === 0 || !awayLineup.startXI || awayLineup.startXI.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">선발 라인업 정보가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">현재 이 경기에 대한 선발 라인업 정보를 제공할 수 없습니다.</p>
          <p className="text-sm text-gray-500 mt-1">API에서 선발 라인업 데이터를 가져오지 못했습니다.</p>
        </div>
      </div>
    );
  }
  
  // 선발 선수 정렬 (포지션별) - 안전 검사 추가
  const sortedHomeStartXI = [...homeLineup.startXI]
    .filter(item => item && item.player && item.player.pos) // player와 pos가 있는 항목만 필터링
    .sort((a, b) => {
      const posOrder = { G: 1, D: 2, M: 3, F: 4 };
      return (posOrder[a.player.pos as keyof typeof posOrder] || 5) - (posOrder[b.player.pos as keyof typeof posOrder] || 5);
    });
    
  const sortedAwayStartXI = [...awayLineup.startXI]
    .filter(item => item && item.player && item.player.pos) // player와 pos가 있는 항목만 필터링
    .sort((a, b) => {
      const posOrder = { G: 1, D: 2, M: 3, F: 4 };
      return (posOrder[a.player.pos as keyof typeof posOrder] || 5) - (posOrder[b.player.pos as keyof typeof posOrder] || 5);
    });
  
  // Formation 컴포넌트에 전달할 데이터 변환
  const prepareFormationData = (teamLineup: TeamLineup) => {
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
  };
  
  // 포메이션 데이터 준비
  let homeFormationData = null;
  let awayFormationData = null;
  
  if (homeLineup && homeLineup.startXI && homeLineup.startXI.length > 0) {
    try {
      homeFormationData = prepareFormationData(homeLineup);
    } catch (error) {
      console.error('홈팀 포메이션 데이터 준비 중 오류:', error);
    }
  }
  
  if (awayLineup && awayLineup.startXI && awayLineup.startXI.length > 0) {
    try {
      awayFormationData = prepareFormationData(awayLineup);
    } catch (error) {
      console.error('원정팀 포메이션 데이터 준비 중 오류:', error);
    }
  }
  
  // 더미 데이터 생성 기능은 필요하지 않으므로 주석 처리 또는 삭제
  // const createDummyTeamData = (teamData: any) => {
  //   return {
  //     team: {
  //       id: 0,
  //       name: "Dummy Team",
  //       colors: {
  //         player: {
  //           primary: 'transparent',
  //           number: 'transparent',
  //           border: 'transparent'
  //         },
  //         goalkeeper: {
  //           primary: 'transparent',
  //           number: 'transparent',
  //           border: 'transparent'
  //         }
  //       }
  //     },
  //     formation: "0-0-0",
  //     startXI: []
  //   };
  // };
  
  return (
    <div>
      {/* 포메이션 시각화 - 제일 상단에 배치 */}
      {(homeFormationData && awayFormationData) && (
        <div className="mb-3">
          <Formation 
            homeTeamData={homeFormationData} 
            awayTeamData={awayFormationData} 
          />
        </div>
      )}
      
      {/* 통합된 테이블 구조 */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500 border-r border-gray-200">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={homeTeam.logo}
                      alt={`${homeTeam.name} 로고`}
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
                  <span className="font-medium">{homeTeam.name}</span>
                </div>
                <div className="text-xs text-gray-500">포메이션: {homeLineup.formation}</div>
              </th>
              <th scope="col" className="w-1/2 py-3 px-4 text-left text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
                    <Image
                      src={awayTeam.logo}
                      alt={`${awayTeam.name} 로고`}
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
                  <span className="font-medium">{awayTeam.name}</span>
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
            {Array.from({ length: Math.max(sortedHomeStartXI.length, sortedAwayStartXI.length) }).map((_, index) => (
              <tr key={`startXI-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {index < sortedHomeStartXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        sortedHomeStartXI[index].player, 
                        homeTeam.id, 
                        homeTeam.name
                      )}
                    >
                      <div className="relative">
                        {sortedHomeStartXI[index].player.photo ? (
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={sortedHomeStartXI[index].player.photo}
                              alt={`${sortedHomeStartXI[index].player.name} 선수 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
                            {sortedHomeStartXI[index].player.number || '-'}
                          </div>
                        )}
                        {sortedHomeStartXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{sortedHomeStartXI[index].player.name}</div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {sortedHomeStartXI[index].player.pos || '-'} {sortedHomeStartXI[index].player.number}
                          <PlayerEvents player={sortedHomeStartXI[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {index < sortedAwayStartXI.length && (
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => handlePlayerClick(
                        sortedAwayStartXI[index].player, 
                        awayTeam.id, 
                        awayTeam.name
                      )}
                    >
                      <div className="relative">
                        {sortedAwayStartXI[index].player.photo ? (
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={sortedAwayStartXI[index].player.photo}
                              alt={`${sortedAwayStartXI[index].player.name} 선수 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
                            {sortedAwayStartXI[index].player.number || '-'}
                          </div>
                        )}
                        {sortedAwayStartXI[index].player.captain && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            C
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{sortedAwayStartXI[index].player.name}</div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {sortedAwayStartXI[index].player.pos || '-'} {sortedAwayStartXI[index].player.number}
                          <PlayerEvents player={sortedAwayStartXI[index].player} events={events} />
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
            
            {/* 교체 선수 행 생성 */}
            {Array.from({ length: Math.max(homeLineup.substitutes.length, awayLineup.substitutes.length) }).map((_, index) => (
              <tr key={`subs-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border-r border-gray-200">
                  {index < homeLineup.substitutes.length && (
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
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={homeLineup.substitutes[index].player.photo}
                              alt={`${homeLineup.substitutes[index].player.name} 선수 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
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
                        <div className="text-sm font-medium">{homeLineup.substitutes[index].player.name}</div>
                        <div className="text-xs text-gray-500 flex items-center flex-wrap">
                          {homeLineup.substitutes[index].player.pos || '-'} {homeLineup.substitutes[index].player.number}
                          <PlayerEvents player={homeLineup.substitutes[index].player} events={events} />
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4">
                  {index < awayLineup.substitutes.length && (
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
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={awayLineup.substitutes[index].player.photo}
                              alt={`${awayLineup.substitutes[index].player.name} 선수 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
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
                        <div className="text-sm font-medium">{awayLineup.substitutes[index].player.name}</div>
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
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={homeLineup.coach.photo}
                              alt={`${homeLineup.coach.name} 감독 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
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
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200">
                            <Image 
                              src={awayLineup.coach.photo}
                              alt={`${awayLineup.coach.name} 감독 사진`}
                              width={40}
                              height={40}
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center text-gray-700 font-bold text-sm">
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
      {selectedPlayer && playersStatsData && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          matchId={matchId?.toString() || ''}
          playerInfo={{
            name: selectedPlayer.name,
            number: selectedPlayer.number,
            pos: selectedPlayer.pos,
            team: selectedPlayer.team
          }}
          preloadedStats={playersStatsData[selectedPlayer.id]}
        />
      )}
    </div>
  );
} 
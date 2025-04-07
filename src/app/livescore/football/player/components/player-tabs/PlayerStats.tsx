'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// 필요한 인터페이스 정의
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  season?: number;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Games {
  appearences?: number;
  lineups?: number;
  minutes?: number;
  position?: string;
  rating?: string;
}

interface Goals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
  cleansheets?: number;
}

interface Shots {
  total?: number;
  on?: number;
}

interface Passes {
  total?: number;
  key?: number;
  accuracy?: string;
  cross?: number;
}

interface Dribbles {
  attempts?: number;
  success?: number;
}

interface Duels {
  total?: number;
  won?: number;
}

interface Tackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
  clearances?: number;
}

interface Fouls {
  drawn?: number;
  committed?: number;
}

interface Cards {
  yellow?: number;
  red?: number;
}

interface Penalty {
  scored?: number;
  missed?: number;
  saved?: number;
}

interface PlayerStatistic {
  team: Team;
  league: League;
  games: Games;
  goals: Goals;
  shots: Shots;
  passes: Passes;
  dribbles: Dribbles;
  duels: Duels;
  tackles: Tackles;
  fouls: Fouls;
  cards: Cards;
  penalty: Penalty;
}

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
  playerId: number;
  preloadedSeasons?: number[];
  preloadedStats?: PlayerStatistic[];
}

export default function PlayerStats({ 
  statistics: initialStatistics, 
  playerId,
  preloadedSeasons,
  preloadedStats
}: PlayerStatsProps) {
  // 초기 통계 데이터에서 시즌 정보 추출
  const initialSeason = initialStatistics && Array.isArray(initialStatistics) && initialStatistics.length > 0 && initialStatistics[0].league
    ? initialStatistics[0].league.season || 2024
    : 2024; // 기본값으로 2024 사용
  
  const [allStatistics, setAllStatistics] = useState<PlayerStatistic[]>(Array.isArray(initialStatistics) ? initialStatistics : []);
  const [filteredStatistics, setFilteredStatistics] = useState<PlayerStatistic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [availableSeasons, setAvailableSeasons] = useState<number[]>(preloadedSeasons || []);
  const [availableLeagues, setAvailableLeagues] = useState<{id: number, name: string, logo: string, country: string}[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  
  // 선수의 모든 시즌 정보 가져오기
  useEffect(() => {
    const fetchPlayerSeasons = async () => {
      if (!playerId) return;
      
      // 이미 preloadedSeasons이 있으면 API 호출 안함
      if (preloadedSeasons && preloadedSeasons.length > 0) {
        setAvailableSeasons(preloadedSeasons);
        setLoadingSeasons(false);
        return;
      }
      
      try {
        setLoadingSeasons(true);
        
        const response = await fetch(`/api/livescore/football/players/${playerId}/seasons`);
        
        if (!response.ok) {
          throw new Error('시즌 데이터를 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        if (data.seasons && data.seasons.length > 0) {
          // 내림차순 정렬 (최신 시즌이 먼저 오도록)
          const sortedSeasons = [...data.seasons].sort((a, b) => b - a);
          
          setAvailableSeasons(sortedSeasons);
          
          // 초기 통계 데이터의 시즌이 있는지 확인
          const initialSeasonIndex = sortedSeasons.findIndex(season => season === initialSeason);
          
          // 초기 시즌이 있으면 선택, 없으면 가장 최근 시즌 선택
          if (initialSeasonIndex !== -1) {
            setSelectedSeason(initialSeason);
          } else if (sortedSeasons.includes(2024)) {
            // 2024 시즌이 있으면 선택
            setSelectedSeason(2024);
          } else {
            setSelectedSeason(sortedSeasons[0]);
          }
        }
      } catch (err) {
        console.error('시즌 데이터 로딩 오류:', err);
      } finally {
        setLoadingSeasons(false);
      }
    };
    
    fetchPlayerSeasons();
  }, [playerId, initialSeason, preloadedSeasons]);

  // 선택한 시즌에 따라 통계 데이터 가져오기
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!playerId || !selectedSeason) return;
      
      // preloadedStats가 있고 현재 선택된 시즌과 일치하면 API 호출 안함
      if (preloadedStats && preloadedStats.length > 0 && selectedSeason === initialSeason) {
        setAllStatistics(preloadedStats);
        
        // 사용 가능한 리그 목록 추출
        const leagues = preloadedStats
          .filter(stat => stat.league && stat.league.id != null)
          .map(stat => ({
            id: stat.league.id,
            name: stat.league.name,
            country: stat.league.country,
            logo: stat.league.logo
          }));
        
        // 중복 제거
        const uniqueLeagues = leagues.filter((league: { id: number, name: string, logo: string, country: string }, index: number, self: { id: number, name: string, logo: string, country: string }[]) => 
          index === self.findIndex((l: { id: number }) => l.id === league.id)
        );
        
        setAvailableLeagues(uniqueLeagues);
        
        // 첫 번째 리그 선택
        if (uniqueLeagues.length > 0) {
          setSelectedLeague(uniqueLeagues[0].id.toString());
          
          // 첫 번째 리그의 통계 데이터 필터링
          const firstLeagueStats = preloadedStats.find(
            stat => stat.league && stat.league.id === uniqueLeagues[0].id
          );
          
          setFilteredStatistics(firstLeagueStats || null);
        }
        
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setSelectedLeague(''); // 시즌이 변경되면 리그 선택 초기화
        
        const url = `/api/livescore/football/players/${playerId}/stats?season=${selectedSeason}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            setAllStatistics([]);
            setFilteredStatistics(null);
            setAvailableLeagues([]);
            setError('해당 시즌에 대한 통계 데이터가 없습니다.');
          } else {
            throw new Error('통계 데이터를 가져오는데 실패했습니다.');
          }
          return;
        }
        
        const data = await response.json();
        
        if (!data.statistics || data.statistics.length === 0) {
          setAllStatistics([]);
          setFilteredStatistics(null);
          setAvailableLeagues([]);
          setError('해당 시즌에 대한 통계 데이터가 없습니다.');
        } else {
          // 모든 통계 데이터 저장
          setAllStatistics(data.statistics);
          
          // 사용 가능한 리그 목록 추출
          const leagues = data.statistics
            .filter((stat: PlayerStatistic) => stat.league && stat.league.id != null)
            .map((stat: PlayerStatistic) => ({
              id: stat.league.id,
              name: stat.league.name,
              country: stat.league.country,
              logo: stat.league.logo
            }));
          
          // 중복 제거
          const uniqueLeagues = leagues.filter((league: { id: number, name: string, logo: string, country: string }, index: number, self: { id: number, name: string, logo: string, country: string }[]) => 
            index === self.findIndex((l: { id: number }) => l.id === league.id)
          );
          
          setAvailableLeagues(uniqueLeagues);
          
          // 첫 번째 리그 선택
          if (uniqueLeagues.length > 0) {
            setSelectedLeague(uniqueLeagues[0].id.toString());
            
            // 첫 번째 리그의 통계 데이터 필터링
            const firstLeagueStats = data.statistics.find(
              (stat: PlayerStatistic) => stat.league && stat.league.id === uniqueLeagues[0].id
            );
            
            setFilteredStatistics(firstLeagueStats || null);
          }
        }
      } catch (err) {
        console.error('통계 데이터 로딩 오류:', err);
        setError('통계 데이터를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [playerId, selectedSeason, initialSeason, preloadedStats]);

  // 선택한 리그에 따라 통계 데이터 필터링
  useEffect(() => {
    if (!selectedLeague || !allStatistics || allStatistics.length === 0) return;
    
    const leagueId = parseInt(selectedLeague);
    const leagueStats = allStatistics.find(
      stat => stat.league && stat.league.id === leagueId
    );
    
    setFilteredStatistics(leagueStats || null);
  }, [selectedLeague, allStatistics]);

  if (loadingSeasons) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (availableSeasons.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">이 선수에 대한 시즌 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 컨트롤 - 드롭다운으로 변경 */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* 시즌 선택 드롭다운 */}
        <div className="relative">
          <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-1">
            시즌
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {availableSeasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        {/* 리그 선택 드롭다운 */}
        <div className="relative">
          <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">
            리그
          </label>
          <select
            id="league-select"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            disabled={availableLeagues.length === 0}
          >
            {availableLeagues.length === 0 ? (
              <option value="">리그 없음</option>
            ) : (
              availableLeagues.map((league) => (
                <option key={league.id} value={league.id.toString()}>
                  {league.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* 선택된 리그 표시 */}
      {selectedLeague && availableLeagues.length > 0 && (
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
          {availableLeagues.find(l => l.id.toString() === selectedLeague)?.logo && (
            <Image
              src={availableLeagues.find(l => l.id.toString() === selectedLeague)?.logo || ''}
              alt="리그 로고"
              width={24}
              height={24}
              className="object-contain"
              unoptimized
            />
          )}
          <span className="font-medium">
            {availableLeagues.find(l => l.id.toString() === selectedLeague)?.name}
          </span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-gray-500">{error}</p>
        </div>
      )}

      {/* 시즌 요약 통계 */}
      {filteredStatistics && !loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <tbody className="divide-y divide-gray-100">
              {/* 기본 정보 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">출전</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.games?.appearences || 0}경기</td>
                <td className="px-4 py-3 font-medium w-1/4">출전시간</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.games?.minutes || 0}분</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">선발</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.games?.lineups || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">평점</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.games?.rating ? Number(filteredStatistics.games.rating).toFixed(2) : '-'}</td>
              </tr>

              {/* 공격포인트 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">득점</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.goals?.total || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">도움</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.goals?.assists || 0}</td>
              </tr>

              {/* 슈팅 */}
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">슈팅</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.shots?.total || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">유효슈팅</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.shots?.on || 0}</td>
              </tr>

              {/* 패스 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">총 패스</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.passes?.total || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">키패스</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.passes?.key || 0}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">패스 성공률</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.passes?.accuracy || 0}%</td>
                <td className="px-4 py-3 font-medium w-1/4">크로스</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.passes?.cross || 0}</td>
              </tr>

              {/* 드리블 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">드리블 시도</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.dribbles?.attempts || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">드리블 성공</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.dribbles?.success || 0}</td>
              </tr>

              {/* 1대1 */}
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">1대1 시도</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.duels?.total || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">1대1 성공</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.duels?.won || 0}</td>
              </tr>

              {/* 수비 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">태클</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.tackles?.total || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">인터셉트</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.tackles?.interceptions || 0}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">차단</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.tackles?.blocks || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">클리어런스</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.tackles?.clearances || 0}</td>
              </tr>

              {/* 파울 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">얻은 파울</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.fouls?.drawn || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">범한 파울</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.fouls?.committed || 0}</td>
              </tr>

              {/* 카드 */}
              <tr>
                <td className="px-4 py-3 font-medium w-1/4">옐로카드</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.cards?.yellow || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">레드카드</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.cards?.red || 0}</td>
              </tr>

              {/* 페널티 */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-medium w-1/4">페널티 득점</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.penalty?.scored || 0}</td>
                <td className="px-4 py-3 font-medium w-1/4">페널티 실축</td>
                <td className="px-4 py-3 w-1/4">{filteredStatistics.penalty?.missed || 0}</td>
              </tr>

              {/* 골키퍼인 경우에만 표시 */}
              {filteredStatistics.games?.position === 'G' && (
                <>
                  <tr>
                    <td className="px-4 py-3 font-medium w-1/4">실점</td>
                    <td className="px-4 py-3 w-1/4">{filteredStatistics.goals?.conceded || 0}</td>
                    <td className="px-4 py-3 font-medium w-1/4">선방</td>
                    <td className="px-4 py-3 w-1/4">{filteredStatistics.goals?.saves || 0}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium w-1/4">무실점</td>
                    <td className="px-4 py-3 w-1/4">{filteredStatistics.goals?.cleansheets || 0}</td>
                    <td className="px-4 py-3 font-medium w-1/4">페널티 선방</td>
                    <td className="px-4 py-3 w-1/4">{filteredStatistics.penalty?.saved || 0}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
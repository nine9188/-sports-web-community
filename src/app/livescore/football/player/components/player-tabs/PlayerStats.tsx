'use client';

import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { fetchPlayerStats, fetchPlayerSeasons } from '@/app/actions/livescore/player/stats';
import { PlayerStatistic as ImportedPlayerStatistic } from '@/app/livescore/football/player/types/player';

// 컴포넌트 내에서 사용할 PlayerStatistic 타입 정의
type PlayerStatistic = ImportedPlayerStatistic;

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
  playerId: number;
  preloadedSeasons?: number[];
  preloadedStats?: PlayerStatistic[];
}

// 리그 로고 컴포넌트 - 메모이제이션 적용
const LeagueLogo = memo(({ logo, name }: { logo: string; name: string }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      <Image
        src={imgError ? '/placeholder-league.png' : logo || '/placeholder-league.png'}
        alt={name || '리그'}
        width={24}
        height={24}
        className="w-5 h-5 md:w-6 md:h-6 object-contain"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
});

LeagueLogo.displayName = 'LeagueLogo';

// 팀 로고 컴포넌트 - 메모이제이션 적용
const TeamLogo = memo(({ logo, name }: { logo: string; name: string }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      <Image
        src={imgError ? '/placeholder-team.png' : logo || '/placeholder-team.png'}
        alt={name || '팀'}
        width={24}
        height={24}
        className="w-5 h-5 md:w-6 md:h-6 object-contain"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

// 현재 시즌 결정 함수
const getCurrentSeason = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // 7월 이후면 다음 시즌으로 간주 (예: 2024년 7월 이후면 2024 시즌)
  return month >= 6 ? year : year - 1;
};

export default function PlayerStats({ 
  statistics: initialStatistics, 
  playerId,
  preloadedSeasons,
  preloadedStats
}: PlayerStatsProps) {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState<number[]>(preloadedSeasons || []);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);
  const [statistics, setStatistics] = useState<PlayerStatistic[]>(initialStatistics || []);
  const [error, setError] = useState<string | null>(null);
  const [loadedStats, setLoadedStats] = useState<Record<string, PlayerStatistic[]>>({});
  
  // 리그 목록 메모이제이션
  const leagues = useMemo(() => {
    // 빈 경우 처리
    if (!statistics || statistics.length === 0) return [];
    
    // 중복 제거된 리그 목록
    return [...new Map(statistics.map(stat => [
      stat.league.id,
      {
        id: stat.league.id,
        name: stat.league.name,
        logo: stat.league.logo || '',
        country: stat.league.country
      }
    ])).values()];
  }, [statistics]);
  
  // 선택된 리그의 통계 데이터 메모이제이션
  const filteredStats = useMemo(() => {
    if (!selectedLeague) return statistics;
    return statistics.filter(stat => stat.league.id === selectedLeague);
  }, [statistics, selectedLeague]);
  
  // 선수의 시즌 목록 가져오기
  const getPlayerSeasons = useCallback(async () => {
    try {
      // 이미 시즌 데이터가 있으면 가져오지 않음
      if (preloadedSeasons && preloadedSeasons.length > 0) {
        console.log(`선수 ${playerId}의 시즌 데이터: 초기 데이터 사용 (${preloadedSeasons.length}개 시즌)`);
        setSeasons(preloadedSeasons);
        // 가장 최근 시즌 선택
        setSelectedSeason(preloadedSeasons[0]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      console.log(`선수 ${playerId}의 시즌 데이터 요청 시작`);
      const startTime = Date.now();
      
      // 서버 액션 직접 호출
      const data = await fetchPlayerSeasons(playerId);
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      
      if (data && data.length > 0) {
        console.log(`선수 ${playerId}의 시즌 데이터 요청 완료: ${data.length}개 시즌, 소요시간: ${loadTime}초`);
        setSeasons(data);
        // 가장 최근 시즌 선택
        setSelectedSeason(data[0]);
      } else {
        // 시즌 데이터가 없을 경우 현재 시즌 사용
        const currentSeason = getCurrentSeason();
        console.log(`선수 ${playerId}의 시즌 데이터가 없어 현재 시즌(${currentSeason}) 사용`);
        setSeasons([currentSeason]);
        setSelectedSeason(currentSeason);
      }
    } catch (err) {
      console.error('시즌 데이터 로딩 오류:', err);
      setError('시즌 정보를 불러오는데 실패했습니다.');
      // 시즌 데이터 로드 실패 시 현재 시즌 사용
      const currentSeason = getCurrentSeason();
      setSeasons([currentSeason]);
      setSelectedSeason(currentSeason);
    } finally {
      setLoading(false);
    }
  }, [playerId, preloadedSeasons]);
  
  // 특정 시즌의 통계 데이터 가져오기
  const getStatistics = useCallback(async (season: number = 0) => {
    try {
      // season이 0이면 선택된 시즌 사용
      const targetSeason = season || selectedSeason;
      if (!targetSeason) return;
      
      // 이미 캐시된 데이터가 있으면 사용
      const cacheKey = `${playerId}-${targetSeason}`;
      if (loadedStats[cacheKey]) {
        console.log(`선수 ${playerId}의 ${targetSeason} 시즌 통계: 캐시 데이터 사용`);
        setStatistics(loadedStats[cacheKey]);
        return;
      }
      
      // 이미 통계 데이터가 있고 preloadedStats가 있으면 확인
      if (preloadedStats && preloadedStats.length > 0) {
        // preloadedStats에서 현재 선택된 시즌 데이터를 확인
        const seasonStats = preloadedStats.filter(stat => 
          stat.league?.season === targetSeason
        );
        
        if (seasonStats.length > 0) {
          console.log(`선수 ${playerId}의 ${targetSeason} 시즌 통계: 초기 데이터 사용 (${seasonStats.length}개 항목)`);
          setStatistics(seasonStats);
          
          // 캐시에 데이터 저장
          setLoadedStats(prev => ({
            ...prev,
            [cacheKey]: seasonStats
          }));
          return;
        }
      }
      
      setLoading(true);
      setError(null);
      
      console.log(`선수 ${playerId}의 ${targetSeason} 시즌 통계 데이터 요청 시작`);
      const startTime = Date.now();
      
      // 서버 액션 직접 호출
      const data = await fetchPlayerStats(playerId, targetSeason);
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      
      if (data && data.length > 0) {
        console.log(`선수 ${playerId}의 ${targetSeason} 시즌 통계 데이터 요청 완료: ${data.length}개 항목, 소요시간: ${loadTime}초`);
        setStatistics(data);
        
        // 캐시에 데이터 저장
        setLoadedStats(prev => ({
          ...prev,
          [cacheKey]: data
        }));
      } else {
        console.log(`선수 ${playerId}의 ${targetSeason} 시즌 통계 데이터 없음`);
        setStatistics([]);
        if (targetSeason === getCurrentSeason()) {
          setError(`${targetSeason} 시즌 통계 정보가 아직 없습니다.`);
        } else {
          setError(`${targetSeason} 시즌 통계 정보를 찾을 수 없습니다.`);
        }
      }
    } catch (err) {
      console.error('통계 데이터 로딩 오류:', err);
      setError('통계 정보를 불러오는데 실패했습니다.');
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  }, [playerId, selectedSeason, preloadedStats, loadedStats]);
  
  // 컴포넌트 마운트 시 시즌 목록 가져오기
  useEffect(() => {
    getPlayerSeasons();
  }, [getPlayerSeasons]);
  
  // 선택된 시즌이 변경되면 해당 시즌의 통계 가져오기
  useEffect(() => {
    if (selectedSeason) {
      getStatistics(selectedSeason);
    }
  }, [selectedSeason, getStatistics]);
  
  // 로딩 중 표시
  if (loading) {
    return null;
  }
  
  // 에러 표시
  if (error) {
    return null;
  }
  
  // 데이터가 없는 경우
  if (!statistics || statistics.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <div className="text-center py-4">
          <div className="mb-4">
            {/* 시즌 선택 드롭다운 */}
            <div className="max-w-xs mx-auto">
              <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-1">
                시즌 선택
              </label>
              <select
                id="season-select"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                <option value="">시즌 선택</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-gray-500">
            {selectedSeason ? `${selectedSeason}/${selectedSeason + 1} 시즌 통계 데이터가 없습니다.` : '통계 데이터가 없습니다.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 시즌 선택 드롭다운 */}
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-1">
                시즌 선택
              </label>
              <select
                id="season-select"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                <option value="">시즌 선택</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 리그 선택 드롭다운 */}
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">
                리그 선택
              </label>
              <select
                id="league-select"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={selectedLeague || ''}
                onChange={(e) => setSelectedLeague(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">모든 리그</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.country})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* 리그별 통계 테이블 */}
      <div className="space-y-4">
        {filteredStats.map((stat, index) => (
          <div key={`${stat.league.id}-${index}`} className="mb-4">
            {/* 모든 통계를 하나의 테이블로 통합 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              {/* 리그 및 팀 헤더 */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
                <LeagueLogo logo={stat.league.logo || ''} name={stat.league.name} />
                <div className="flex items-center">
                  <h3 className="font-semibold text-sm">{stat.league.name}</h3>
                  <span className="text-xs text-gray-600 ml-1">({stat.league.country})</span>
                </div>
                <div className="flex items-center ml-auto gap-2">
                  <TeamLogo logo={stat.team.logo} name={stat.team.name} />
                  <span className="font-medium text-sm">{stat.team.name}</span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">기본 정보</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 border-b">
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500 uppercase">포지션</h4>
                    <p className="font-semibold text-sm">{stat.games.position || '-'}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500 uppercase">경기 출전</h4>
                    <p className="font-semibold text-sm">{stat.games.appearences || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500 uppercase">선발 출전</h4>
                    <p className="font-semibold text-sm">{stat.games.lineups || 0}</p>
                  </div>
                  <div className="p-2 flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500 uppercase">출전 시간</h4>
                    <p className="font-semibold text-sm">{stat.games.minutes || 0}분</p>
                  </div>
                </div>
              </div>
              
              {/* 공격 통계 */}
              <div className="border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">공격 통계</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 border-b">
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">득점</h4>
                    <p className="font-medium text-sm">{stat.goals.total || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">도움</h4>
                    <p className="font-medium text-sm">{stat.goals.assists || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">슈팅</h4>
                    <p className="font-medium text-sm">{stat.shots.total || 0}</p>
                  </div>
                  <div className="p-2 flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">유효 슈팅</h4>
                    <p className="font-medium text-sm">{stat.shots.on || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* 패스 통계 */}
              <div className="p-2 border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">패스 통계</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 border-b">
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">총 패스</h4>
                    <p className="font-medium text-sm">{stat.passes.total || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">키패스</h4>
                    <p className="font-medium text-sm">{stat.passes.key || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">패스 정확도</h4>
                    <p className="font-medium text-sm">{stat.passes.accuracy || '0%'}</p>
                  </div>
                  <div className="p-2 flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">크로스</h4>
                    <p className="font-medium text-sm">{stat.passes.cross || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* 수비 통계 */}
              <div className="border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">수비 통계</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 border-b">
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">태클</h4>
                    <p className="font-medium text-sm">{stat.tackles.total || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">차단</h4>
                    <p className="font-medium text-sm">{stat.tackles.blocks || 0}</p>
                  </div>
                  <div className="p-2 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">인터셉트</h4>
                    <p className="font-medium text-sm">{stat.tackles.interceptions || 0}</p>
                  </div>
                  <div className="p-2 flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">클리어런스</h4>
                    <p className="font-medium text-sm">{stat.tackles.clearances || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* 카드 및 기타 통계 */}
              <div className={stat.games.position === 'Goalkeeper' ? 'border-b' : ''}>
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">기타 통계</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-6">
                  <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">옐로카드</h4>
                    <p className="font-medium text-sm">{stat.cards.yellow || 0}</p>
                  </div>
                  <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">레드카드</h4>
                    <p className="font-medium text-sm">{stat.cards.red || 0}</p>
                  </div>
                  <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">드리블 시도</h4>
                    <p className="font-medium text-sm">{stat.dribbles.attempts || 0}</p>
                  </div>
                  <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">드리블 성공</h4>
                    <p className="font-medium text-sm">{stat.dribbles.success || 0}</p>
                  </div>
                  <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">파울 유도</h4>
                    <p className="font-medium text-sm">{stat.fouls.drawn || 0}</p>
                  </div>
                  <div className="p-2 flex justify-between sm:block">
                    <h4 className="text-xs text-gray-500">파울 범함</h4>
                    <p className="font-medium text-sm">{stat.fouls.committed || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* 골키퍼 통계 (포지션이 골키퍼인 경우만 표시) */}
              {stat.games.position === 'Goalkeeper' && (
                <div>
                  <div className="py-1 px-2 bg-gray-50 border-b">
                    <h3 className="text-xs font-semibold">골키퍼 통계</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4">
                    <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                      <h4 className="text-xs text-gray-500">세이브</h4>
                      <p className="font-medium text-sm">{stat.goals.saves || 0}</p>
                    </div>
                    <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                      <h4 className="text-xs text-gray-500">실점</h4>
                      <p className="font-medium text-sm">{stat.goals.conceded || 0}</p>
                    </div>
                    <div className="p-2 border-b sm:border-b-0 border-r sm:border-r flex justify-between sm:block">
                      <h4 className="text-xs text-gray-500">무실점 경기</h4>
                      <p className="font-medium text-sm">{stat.goals.cleansheets || 0}</p>
                    </div>
                    <div className="p-2 flex justify-between sm:block">
                      <h4 className="text-xs text-gray-500">페널티 세이브</h4>
                      <p className="font-medium text-sm">{stat.penalty.saved || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
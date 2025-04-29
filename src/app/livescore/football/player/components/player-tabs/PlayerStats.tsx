'use client';

import { useState, useMemo, memo } from 'react';
import Image from 'next/image';
import { PlayerStatistic as ImportedPlayerStatistic } from '@/app/livescore/football/player/types/player';
import { EmptyState } from '@/app/livescore/football/components/CommonComponents';

// 컴포넌트 내에서 사용할 PlayerStatistic 타입 정의
type PlayerStatistic = ImportedPlayerStatistic;

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
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

// 현재 시즌 계산
const getCurrentSeason = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // 7월 이후면 다음 시즌으로 간주 (예: 2024년 7월 이후면 2024 시즌)
  return month >= 6 ? year : year - 1;
};

export default function PlayerStats({ 
  statistics: initialStatistics, 
  preloadedSeasons = [],
  preloadedStats = []
}: PlayerStatsProps) {
  // 현재 시즌 계산
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  
  // 미래 시즌 필터링 (현재 + 1년까지만 허용)
  const validSeasons = useMemo(() => {
    return preloadedSeasons.filter(season => season <= currentSeason + 1);
  }, [preloadedSeasons, currentSeason]);
  
  // 초기 선택 시즌은 currentSeason으로 설정하거나 가장 가까운 시즌 선택
  const initialSeason = useMemo(() => {
    if (validSeasons.length === 0) return currentSeason;
    
    // 현재 시즌이 있으면 현재 시즌 선택
    if (validSeasons.includes(currentSeason)) return currentSeason;
    
    // 현재 시즌과 가장 가까운 시즌 선택 (내림차순 정렬되어 있으므로 첫 번째 요소가 가장 최신)
    return validSeasons[0];
  }, [validSeasons, currentSeason]);
  
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  
  // 리그 목록 메모이제이션
  const leagues = useMemo(() => {
    // 빈 경우 처리
    if (!initialStatistics || initialStatistics.length === 0) return [];
    
    // 중복 제거된 리그 목록
    return [...new Map(initialStatistics.map(stat => [
      stat.league.id,
      {
        id: stat.league.id,
        name: stat.league.name,
        logo: stat.league.logo || '',
        country: stat.league.country
      }
    ])).values()];
  }, [initialStatistics]);
  
  // 선택된 시즌의 통계 데이터
  const seasonStats = useMemo(() => {
    if (!selectedSeason) return initialStatistics;
    
    // preloadedStats에서 현재 선택된 시즌 데이터를 확인
    const stats = preloadedStats.filter(stat => 
      stat.league?.season === selectedSeason
    );
    
    return stats;
  }, [selectedSeason, preloadedStats, initialStatistics]);
  
  // 선택된 리그의 통계 데이터 메모이제이션
  const filteredStats = useMemo(() => {
    if (!selectedLeague) return seasonStats;
    return seasonStats.filter(stat => stat.league.id === selectedLeague);
  }, [seasonStats, selectedLeague]);
  
  // 데이터가 없는 경우
  if (!initialStatistics || initialStatistics.length === 0) {
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
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                {validSeasons.map((season) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <EmptyState 
            title="통계 데이터가 없습니다" 
            message={selectedSeason ? `${selectedSeason}/${selectedSeason + 1} 시즌 통계 데이터가 없습니다.` : '통계 데이터가 없습니다.'} 
          />
        </div>
      </div>
    );
  }
  
  // 선택된 시즌에 데이터가 없는 경우
  if (selectedSeason && filteredStats.length === 0) {
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
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                {validSeasons.map((season) => (
                  <option key={season} value={season}>
                    {season}/{season + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <EmptyState 
            title="통계 데이터가 없습니다" 
            message={`${selectedSeason}/${selectedSeason + 1} 시즌 통계 데이터가 없습니다.`} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              {/* 시즌 선택 드롭다운 */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <label htmlFor="season-select" className="block text-sm font-medium text-gray-700 mb-1">
                  시즌 선택
                </label>
                <select
                  id="season-select"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                >
                  {validSeasons.map((season) => (
                    <option key={season} value={season}>
                      {season}/{season + 1}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 리그 선택 드롭다운 */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
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
          
          {/* 선택된 리그 표시 */}
          {selectedLeague && (
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <div className="w-6 h-6 flex items-center justify-center">
                <Image
                  src={leagues.find(l => l.id === selectedLeague)?.logo || '/placeholder-league.png'}
                  alt={leagues.find(l => l.id === selectedLeague)?.name || '리그'}
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
                  unoptimized
                />
              </div>
              <span className="font-medium">
                {leagues.find(l => l.id === selectedLeague)?.name}
              </span>
            </div>
          )}
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
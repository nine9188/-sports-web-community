'use client';

import { useState, useMemo, memo } from 'react';
import Image from 'next/image';
import { PlayerStatistic } from '@/domains/livescore/types/player';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
}

// 리그 로고 컴포넌트 - 메모이제이션 적용
const LeagueLogo = memo(({ logo, name, leagueId }: { logo: string; name: string; leagueId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {logo && leagueId ? (
        <ApiSportsImage
          src={logo}
          imageId={leagueId}
          imageType={ImageType.Leagues}
          alt={name || '리그'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <Image
          src={logo || '/placeholder-league.png'}
          alt={name || '리그'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
          unoptimized
        />
      )}
    </div>
  );
});

LeagueLogo.displayName = 'LeagueLogo';

// 팀 로고 컴포넌트 - 메모이제이션 적용
const TeamLogo = memo(({ logo, name, teamId }: { logo: string; name: string; teamId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {logo && teamId ? (
        <ApiSportsImage
          src={logo}
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name || '팀'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <Image
          src={logo || '/placeholder-team.png'}
          alt={name || '팀'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
          unoptimized
        />
      )}
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

export default function PlayerStats({ statistics: initialStatistics }: PlayerStatsProps) {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  
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
  
  // 선택된 리그의 통계 데이터 메모이제이션
  const filteredStats = useMemo(() => {
    if (!selectedLeague) return initialStatistics;
    return initialStatistics.filter(stat => stat.league.id === selectedLeague);
  }, [initialStatistics, selectedLeague]);
  
  // 데이터가 없는 경우
  if (!initialStatistics || initialStatistics.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <div className="text-center py-4">
          <EmptyState 
            title="통계 데이터가 없습니다" 
            message="통계 데이터가 없습니다." 
          />
        </div>
      </div>
    );
  }
  
  // 선택된 리그의 데이터가 없는 경우
  if (selectedLeague && filteredStats.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <div className="text-center py-4">
          <EmptyState 
            title="통계 데이터가 없습니다" 
            message="선택된 리그의 통계 데이터가 없습니다." 
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
                <ApiSportsImage
                  src={leagues.find(l => l.id === selectedLeague)?.logo || '/placeholder-league.png'}
                  imageId={selectedLeague}
                  imageType={ImageType.Leagues}
                  alt={leagues.find(l => l.id === selectedLeague)?.name || '리그'}
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
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
                                            <TeamLogo logo={stat.team.logo} name={stat.team.name} teamId={stat.team.id} />
                  <span className="font-medium text-sm">{stat.team.name}</span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">기본 정보</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500 uppercase">포지션</h4>
                    <p className="font-semibold text-sm">{stat.games.position || '-'}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500 uppercase">경기 출전</h4>
                    <p className="font-semibold text-sm">{stat.games.appearences || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500 uppercase">선발 출전</h4>
                    <p className="font-semibold text-sm">{stat.games.lineups || 0}</p>
                  </div>
                  <div className="p-2 border-b md:border-b-0">
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
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">득점</h4>
                    <p className="font-medium text-sm">{stat.goals.total || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">도움</h4>
                    <p className="font-medium text-sm">{stat.goals.assists || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">슈팅</h4>
                    <p className="font-medium text-sm">{stat.shots.total || 0}</p>
                  </div>
                  <div className="p-2 border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">유효 슈팅</h4>
                    <p className="font-medium text-sm">{stat.shots.on || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* 패스 통계 */}
              <div className="border-b">
                <div className="py-1 px-2 bg-gray-50 border-b">
                  <h3 className="text-xs font-semibold">패스 통계</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">총 패스</h4>
                    <p className="font-medium text-sm">{stat.passes.total || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">키패스</h4>
                    <p className="font-medium text-sm">{stat.passes.key || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">패스 정확도</h4>
                    <p className="font-medium text-sm">{stat.passes.accuracy || '0%'}</p>
                  </div>
                  <div className="p-2 border-b md:border-b-0">
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
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">태클</h4>
                    <p className="font-medium text-sm">{stat.tackles.total || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">차단</h4>
                    <p className="font-medium text-sm">{stat.tackles.blocks || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">인터셉트</h4>
                    <p className="font-medium text-sm">{stat.tackles.interceptions || 0}</p>
                  </div>
                  <div className="p-2 border-b md:border-b-0">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">옐로카드</h4>
                    <p className="font-medium text-sm">{stat.cards.yellow || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0">
                    <h4 className="text-xs text-gray-500">레드카드</h4>
                    <p className="font-medium text-sm">{stat.cards.red || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b md:border-b-0 lg:border-b-0">
                    <h4 className="text-xs text-gray-500">드리블 시도</h4>
                    <p className="font-medium text-sm">{stat.dribbles.attempts || 0}</p>
                  </div>
                  <div className="p-2 border-r border-b lg:border-b-0">
                    <h4 className="text-xs text-gray-500">드리블 성공</h4>
                    <p className="font-medium text-sm">{stat.dribbles.success || 0}</p>
                  </div>
                  <div className="p-2 border-r">
                    <h4 className="text-xs text-gray-500">파울 유도</h4>
                    <p className="font-medium text-sm">{stat.fouls.drawn || 0}</p>
                  </div>
                  <div className="p-2">
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
                  <div className="grid grid-cols-2 md:grid-cols-4">
                    <div className="p-2 border-r border-b md:border-b-0">
                      <h4 className="text-xs text-gray-500">세이브</h4>
                      <p className="font-medium text-sm">{stat.goals.saves || 0}</p>
                    </div>
                    <div className="p-2 border-r border-b md:border-b-0">
                      <h4 className="text-xs text-gray-500">실점</h4>
                      <p className="font-medium text-sm">{stat.goals.conceded || 0}</p>
                    </div>
                    <div className="p-2 border-r border-b md:border-b-0">
                      <h4 className="text-xs text-gray-500">무실점 경기</h4>
                      <p className="font-medium text-sm">{stat.goals.cleansheets || 0}</p>
                    </div>
                    <div className="p-2 border-b md:border-b-0">
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
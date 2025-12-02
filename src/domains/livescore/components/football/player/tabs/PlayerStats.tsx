'use client';

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { PlayerStatistic } from '@/domains/livescore/types/player';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { Container, ContainerHeader, ContainerContent } from '@/shared/components/ui';
import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
}

// 포지션 한글 매핑
const POSITION_MAPPINGS: Record<string, string> = {
  'Goalkeeper': '골키퍼',
  'Defender': '수비수',
  'Midfielder': '미드필더',
  'Attacker': '공격수',
  'Forward': '공격수'
};

// 리그 로고 컴포넌트 - 메모이제이션 적용
const LeagueLogo = memo(({ name, leagueId }: { name: string; leagueId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {leagueId && leagueId > 0 ? (
        <ApiSportsImage
          imageId={leagueId}
          imageType={ImageType.Leagues}
          alt={name || '리그'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded">
          리그
        </div>
      )}
    </div>
  );
});

LeagueLogo.displayName = 'LeagueLogo';

// 팀 로고 컴포넌트 - 메모이제이션 적용
const TeamLogo = memo(({ name, teamId }: { name: string; teamId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {teamId && teamId > 0 ? (
        <ApiSportsImage
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name || '팀'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded">
          팀
        </div>
      )}
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

/**
 * 리그 우선순위 정의 (숫자가 작을수록 우선순위가 높음)
 */
function getLeaguePriority(leagueId: number): number {
  // 메이저 리그 (Top 5)
  const majorLeagues = [39, 140, 78, 135, 61]; // 프리미어, 라리가, 분데스, 세리에A, 리그1
  if (majorLeagues.includes(leagueId)) return 1;

  // 2군 유럽 리그
  const secondTierLeagues = [40, 179, 88, 94, 119]; // 챔피언십, 스코틀랜드, 에레디비지에, 프리메이라, 슈퍼리가
  if (secondTierLeagues.includes(leagueId)) return 2;

  // 주요 아시아/아메리카 리그
  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169]; // K리그, J리그, MLS, 사우디, 브라질, 리가MX, 중국
  if (otherMajorLeagues.includes(leagueId)) return 3;

  // 유럽 컵 대회
  const europeanCups = [2, 3, 848]; // 챔스, 유로파, 컨퍼런스
  if (europeanCups.includes(leagueId)) return 4;

  // 기타 컵 대회 (최하위 우선순위)
  return 5;
}

export default function PlayerStats({ statistics: initialStatistics }: PlayerStatsProps) {
  // 통계 데이터를 리그 우선순위로 정렬
  const sortedStats = useMemo(() => {
    if (!initialStatistics || initialStatistics.length === 0) return [];
    
    return [...initialStatistics].sort((a, b) => {
      const priorityA = getLeaguePriority(a.league.id);
      const priorityB = getLeaguePriority(b.league.id);
      return priorityA - priorityB;
    });
  }, [initialStatistics]);
  
  // 데이터가 없는 경우
  if (!initialStatistics || initialStatistics.length === 0) {
    return (
      <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="text-center py-8">
          <EmptyState 
            title="통계 데이터가 없습니다" 
            message="통계 데이터가 없습니다." 
          />
        </ContainerContent>
      </Container>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 리그별 통계 테이블 */}
      {sortedStats.map((stat, index) => (
        <Container key={`${stat.league.id}-${index}`} className="mb-4 bg-white dark:bg-[#1D1D1D]">
          {/* 리그 및 팀 헤더 */}
          <ContainerHeader>
            <div className="flex items-center gap-2 flex-1">
              <LeagueLogo name={stat.league.name} leagueId={stat.league.id} />
              <div className="flex items-center">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">
                  {getLeagueKoreanName(stat.league.name) || stat.league.name}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({stat.league.country})</span>
              </div>
              <Link 
                href={`/livescore/football/team/${stat.team.id}`}
                className="flex items-center ml-auto gap-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors px-2 py-1 rounded outline-none focus:outline-none"
              >
                <TeamLogo name={stat.team.name} teamId={stat.team.id} />
                <span className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">
                  {getTeamById(stat.team.id)?.name_ko || stat.team.name}
                </span>
              </Link>
            </div>
          </ContainerHeader>
          
          <ContainerContent className="!p-0">

            {/* 기본 정보 */}
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">기본 정보</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">포지션</h4>
                  <p className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {stat.games.position ? (POSITION_MAPPINGS[stat.games.position] || stat.games.position) : '-'}
                  </p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">경기 출전</h4>
                  <p className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.games.appearences || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">선발 출전</h4>
                  <p className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.games.lineups || 0}</p>
                </div>
                <div className="p-3">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">출전 시간</h4>
                  <p className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.games.minutes || 0}분</p>
                </div>
              </div>
            </div>
              
            {/* 공격 통계 */}
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">공격 통계</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">득점</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.goals.total || 0}</p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">도움</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.goals.assists || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">슈팅</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.shots.total || 0}</p>
                </div>
                <div className="p-3">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">유효 슈팅</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.shots.on || 0}</p>
                </div>
              </div>
            </div>
              
            {/* 패스 통계 */}
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">패스 통계</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">총 패스</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.passes.total || 0}</p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">키패스</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.passes.key || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">패스 정확도</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.passes.accuracy || '0%'}</p>
                </div>
                <div className="p-3">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">크로스</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.passes.cross || 0}</p>
                </div>
              </div>
            </div>
              
            {/* 수비 통계 */}
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">수비 통계</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">태클</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.tackles.total || 0}</p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">차단</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.tackles.blocks || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">인터셉트</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.tackles.interceptions || 0}</p>
                </div>
                <div className="p-3">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">클리어런스</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.tackles.clearances || 0}</p>
                </div>
              </div>
            </div>
              
            {/* 카드 및 기타 통계 */}
            <div className={stat.games.position === 'Goalkeeper' ? 'border-b border-black/5 dark:border-white/10' : ''}>
              <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">기타 통계</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">옐로카드</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.cards.yellow || 0}</p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">레드카드</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.cards.red || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0 lg:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">드리블 시도</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.dribbles.attempts || 0}</p>
                </div>
                <div className="p-3 border-b border-black/5 dark:border-white/10 lg:border-b-0 lg:border-r">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">드리블 성공</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.dribbles.success || 0}</p>
                </div>
                <div className="p-3 border-r border-b border-black/5 dark:border-white/10 lg:border-b-0">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">파울 유도</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.fouls.drawn || 0}</p>
                </div>
                <div className="p-3">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400">파울 범함</h4>
                  <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.fouls.committed || 0}</p>
                </div>
              </div>
            </div>
              
            {/* 골키퍼 통계 (포지션이 골키퍼인 경우만 표시) */}
            {stat.games.position === 'Goalkeeper' && (
              <div>
                <div className="py-3 px-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">골키퍼 통계</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400">세이브</h4>
                    <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.goals.saves || 0}</p>
                  </div>
                  <div className="p-3 border-b border-black/5 dark:border-white/10 md:border-b-0 md:border-r">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400">실점</h4>
                    <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.goals.conceded || 0}</p>
                  </div>
                  <div className="p-3 border-r border-b border-black/5 dark:border-white/10 md:border-b-0">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400">무실점 경기</h4>
                    <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.goals.cleansheets || 0}</p>
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400">페널티 세이브</h4>
                    <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{stat.penalty.saved || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </ContainerContent>
        </Container>
      ))}
    </div>
  );
} 
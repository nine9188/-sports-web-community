'use client';

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { PlayerStatistic } from '@/domains/livescore/types/player';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
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

// 리그 로고 컴포넌트
const LeagueLogo = memo(({ name, leagueId }: { name: string; leagueId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {leagueId && leagueId > 0 ? (
        <UnifiedSportsImage
          imageId={leagueId}
          imageType={ImageType.Leagues}
          alt={name || '리그'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <div className="w-5 h-5 md:w-6 md:h-6 bg-[#EAEAEA] dark:bg-[#333333] flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs rounded">
          리그
        </div>
      )}
    </div>
  );
});

LeagueLogo.displayName = 'LeagueLogo';

// 팀 로고 컴포넌트
const TeamLogo = memo(({ name, teamId }: { name: string; teamId?: number }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      {teamId && teamId > 0 ? (
        <UnifiedSportsImage
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={name || '팀'}
          width={24}
          height={24}
          className="w-5 h-5 md:w-6 md:h-6 object-contain"
        />
      ) : (
        <div className="w-5 h-5 md:w-6 md:h-6 bg-[#EAEAEA] dark:bg-[#333333] flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs rounded">
          팀
        </div>
      )}
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

function getLeaguePriority(leagueId: number): number {
  const majorLeagues = [39, 140, 78, 135, 61];
  if (majorLeagues.includes(leagueId)) return 1;

  const secondTierLeagues = [40, 179, 88, 94, 119];
  if (secondTierLeagues.includes(leagueId)) return 2;

  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169];
  if (otherMajorLeagues.includes(leagueId)) return 3;

  const europeanCups = [2, 3, 848];
  if (europeanCups.includes(leagueId)) return 4;

  return 5;
}

export default function PlayerStats({ statistics: initialStatistics }: PlayerStatsProps) {
  const sortedStats = useMemo(() => {
    if (!initialStatistics || initialStatistics.length === 0) return [];

    return [...initialStatistics].sort((a, b) => {
      const priorityA = getLeaguePriority(a.league.id);
      const priorityB = getLeaguePriority(b.league.id);
      return priorityA - priorityB;
    });
  }, [initialStatistics]);

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
    <div className="space-y-6">
      {sortedStats.map((stat, index) => {
        const isGoalkeeper = stat.games.position === 'Goalkeeper';

        return (
          <div key={`${stat.league.id}-${index}`} className="space-y-4">
            {isGoalkeeper ? (
              <>
                {/* 골키퍼: 리그헤더 + 기본 정보 + 공격 통계 */}
                <Container className="bg-white dark:bg-[#1D1D1D]">
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
                  <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                      기본 정보
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
                    </div>
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                      공격 통계
                    </div>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      <div className="flex-1 flex">
                        {['포지션', '출전', '선발', '시간'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                      <div className="flex-1 flex">
                        {['득점', '도움', '슈팅', '유효'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.games.position ? (POSITION_MAPPINGS[stat.games.position] || stat.games.position) : '-'}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.games.appearences || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.games.lineups || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.games.minutes || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.assists || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.shots.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                          {stat.shots.on || 0}
                        </div>
                      </div>
                    </div>
                  </ContainerContent>
                </Container>

                {/* 골키퍼: 패스 통계 + 수비 통계 */}
                <Container>
                  <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                      패스 통계
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
                    </div>
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                      수비 통계
                    </div>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      <div className="flex-1 flex">
                        {['패스', '키패스', '정확도', '크로스'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                      <div className="flex-1 flex">
                        {['태클', '차단', '인터셉트', '클리어'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.key || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.accuracy ? `${stat.passes.accuracy}%` : '-'}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.cross || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.blocks || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.interceptions || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                          {stat.tackles.clearances || 0}
                        </div>
                      </div>
                    </div>
                  </ContainerContent>
                </Container>

                {/* 골키퍼: 기타 통계 + 골키퍼 통계 */}
                <Container>
                  <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                      기타 통계
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
                    </div>
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                      골키퍼 통계
                    </div>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      <div className="flex-1 flex">
                        {['경고', '퇴장', '드리블', '파울'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                      <div className="flex-1 flex">
                        {['세이브', '실점', '클린시트', 'PK선방'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.cards.yellow || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.cards.red || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {`${stat.dribbles.success || 0}/${stat.dribbles.attempts || 0}`}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {`${stat.fouls.drawn || 0}/${stat.fouls.committed || 0}`}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.saves || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.conceded || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.cleansheets || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                          {stat.penalty.saved || 0}
                        </div>
                      </div>
                    </div>
                  </ContainerContent>
                </Container>
              </>
            ) : (
              <>
                {/* 필드 플레이어: 리그헤더 + 기본 정보 */}
                <Container className="bg-white dark:bg-[#1D1D1D]">
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
                  <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">기본 정보</span>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      {['포지션', '출전', '선발', '시간'].map((label) => (
                        <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                      ))}
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                        {stat.games.position ? (POSITION_MAPPINGS[stat.games.position] || stat.games.position) : '-'}
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                      </div>
                      <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                        {stat.games.appearences || 0}
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                      </div>
                      <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                        {stat.games.lineups || 0}
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                      </div>
                      <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                        {stat.games.minutes || 0}
                      </div>
                    </div>
                  </ContainerContent>
                </Container>

                {/* 필드 플레이어: 공격 통계 + 패스 통계 */}
                <Container>
                  <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                      공격 통계
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
                    </div>
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                      패스 통계
                    </div>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      <div className="flex-1 flex">
                        {['득점', '도움', '슈팅', '유효'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                      <div className="flex-1 flex">
                        {['패스', '키패스', '정확도', '크로스'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.goals.assists || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.shots.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.shots.on || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.key || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.passes.accuracy ? `${stat.passes.accuracy}%` : '-'}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                          {stat.passes.cross || 0}
                        </div>
                      </div>
                    </div>
                  </ContainerContent>
                </Container>

                {/* 필드 플레이어: 수비 통계 + 기타 통계 */}
                <Container>
                  <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                      수비 통계
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
                    </div>
                    <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                      기타 통계
                    </div>
                  </div>
                  <ContainerContent className="!p-0">
                    <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                      <div className="flex-1 flex">
                        {['태클', '차단', '인터셉트', '클리어'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                      <div className="flex-1 flex">
                        {['경고', '퇴장', '드리블', '파울'].map((label) => (
                          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.total || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.blocks || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.interceptions || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.tackles.clearances || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.cards.yellow || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {stat.cards.red || 0}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                          {`${stat.dribbles.success || 0}/${stat.dribbles.attempts || 0}`}
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        </div>
                        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                          {`${stat.fouls.drawn || 0}/${stat.fouls.committed || 0}`}
                        </div>
                      </div>
                    </div>
                  </ContainerContent>
                </Container>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

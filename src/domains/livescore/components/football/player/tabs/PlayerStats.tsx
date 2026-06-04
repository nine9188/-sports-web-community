'use client';

import { useMemo, memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayerStatistic } from '@/domains/livescore/types/player';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Container, ContainerHeader, ContainerContent } from '@/shared/components/ui';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';
import PlayerTabEmptyState from './PlayerTabEmptyState';

// 4590 표준: placeholder 상수
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

// 포지션 한글 매핑
const POSITION_MAPPINGS: Record<string, string> = {
  'Goalkeeper': '골키퍼',
  'Defender': '수비수',
  'Midfielder': '미드필더',
  'Attacker': '공격수',
  'Forward': '공격수'
};

// 4590 표준: 리그 로고 컴포넌트
const LeagueLogo = memo(({ name, logoUrl }: { name: string; logoUrl: string }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      <UnifiedSportsImageClient
        src={logoUrl}
        alt={name || '리그'}
        width={24}
        height={24}
        className="w-5 h-5 md:w-6 md:h-6 object-contain"
      />
    </div>
  );
});

LeagueLogo.displayName = 'LeagueLogo';

// 4590 표준: 팀 로고 컴포넌트
const TeamLogo = memo(({ name, logoUrl }: { name: string; logoUrl: string }) => {
  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      <UnifiedSportsImageClient
        src={logoUrl}
        alt={name || '팀'}
        width={24}
        height={24}
        className="w-5 h-5 md:w-6 md:h-6 object-contain"
      />
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

function displayValue(value: string | number | boolean | undefined | null, suffix = '') {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  return `${value}${suffix}`;
}

function StatRow({
  labels,
  values,
}: {
  labels: string[];
  values: Array<string | number | boolean | undefined | null>;
}) {
  return (
    <>
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        {labels.map((label) => (
          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
        ))}
      </div>
      <div className="flex items-center py-3">
        {values.map((value, index) => (
          <div key={`${labels[index]}-${index}`} className="flex-1 text-center text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0] relative">
            {value}
            {index < values.length - 1 && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function StatCard({
  title,
  rows,
  className = '',
}: {
  title: string;
  rows: Array<{ labels: string[]; values: Array<string | number | boolean | undefined | null> }>;
  className?: string;
}) {
  return (
    <Container className={className}>
      <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">{title}</span>
      </div>
      <ContainerContent className="!p-0">
        {rows.map((row, index) => (
          <StatRow
            key={`${title}-${index}`}
            labels={row.labels}
            values={row.values}
          />
        ))}
      </ContainerContent>
    </Container>
  );
}

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

export default function PlayerStats({
  statistics: initialStatistics,
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: PlayerStatsProps) {
  const { getTeamById, getLeagueKoreanName } = useTeamLeague();
  // 4590 표준: 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 초기 다크모드 상태 확인
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    // MutationObserver로 다크모드 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // 4590 표준: URL 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => {
    if (isDark && leagueLogoDarkUrls[id]) {
      return leagueLogoDarkUrls[id];
    }
    return leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  };
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
      <PlayerTabEmptyState
        title="선수 통계"
        message="통계 데이터가 없습니다."
      />
    );
  }

  return (
    <div className="space-y-6">
      {sortedStats.map((stat, index) => {
        const isGoalkeeper = stat.games.position === 'Goalkeeper';

        return (
          <div key={`${stat.league.id}-${index}`} className="space-y-0">
            {index > 0 && (
              <hr className="border-black/5 dark:border-white/10" />
            )}
            <>
                <Container className="bg-white dark:bg-[#1D1D1D] md:rounded-b-none">
                  <ContainerHeader>
                    <div className="flex items-center gap-2 flex-1">
                      <LeagueLogo name={stat.league.name} logoUrl={getLeagueLogo(stat.league.id)} />
                      <div className="flex items-center">
                        <h2 className="font-semibold text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                          {getLeagueKoreanName(stat.league.name) || stat.league.name}
                        </h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          ({[stat.league.season, stat.league.country].filter(Boolean).join(' · ')})
                        </span>
                      </div>
                      <Link
                        href={getTeamHref(stat.team)}
                        className="flex items-center ml-auto gap-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors px-2 py-1 rounded outline-none focus:outline-none"
                      prefetch={false}
                      >
                        <TeamLogo name={stat.team.name} logoUrl={getTeamLogo(stat.team.id)} />
                        <span className="font-medium text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                          {getTeamById(stat.team.id)?.name_ko || stat.team.name}
                        </span>
                      </Link>
                    </div>
                  </ContainerHeader>
                  <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                    <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">기본 정보</span>
                  </div>
                  <ContainerContent className="!p-0">
                    <StatRow
                      labels={['포지션', '등번호', '출전', '선발']}
                      values={[
                        stat.games.position ? (POSITION_MAPPINGS[stat.games.position] || stat.games.position) : '-',
                        displayValue(stat.games.number),
                        displayValue(stat.games.appearences),
                        displayValue(stat.games.lineups),
                      ]}
                    />
                    <StatRow
                      labels={['시즌', '시간', '평점', '주장']}
                      values={[
                        displayValue(stat.league.season),
                        displayValue(stat.games.minutes),
                        displayValue(stat.games.rating),
                        displayValue(stat.games.captain),
                      ]}
                    />
                  </ContainerContent>
                </Container>
                <StatCard
                  title="공격 통계"
                  className="border-t-0 md:rounded-none"
                  rows={[{
                    labels: ['득점', '도움', '슈팅', '유효'],
                    values: [stat.goals.total || 0, stat.goals.assists || 0, stat.shots.total || 0, stat.shots.on || 0],
                  }]}
                />
                <StatCard
                  title="패스 통계"
                  className="border-t-0 md:rounded-none"
                  rows={[{
                    labels: ['패스', '키패스', '정확도', '크로스'],
                    values: [stat.passes.total || 0, stat.passes.key || 0, stat.passes.accuracy ? `${stat.passes.accuracy}%` : '-', stat.passes.cross || 0],
                  }]}
                />
                <StatCard
                  title="수비 통계"
                  className="border-t-0 md:rounded-none"
                  rows={[{
                    labels: ['태클', '차단', '인터셉트', '클리어'],
                    values: [stat.tackles.total || 0, stat.tackles.blocks || 0, stat.tackles.interceptions || 0, stat.tackles.clearances || 0],
                  }]}
                />
                {isGoalkeeper && (
                  <StatCard
                    title="골키퍼 통계"
                    className="border-t-0 md:rounded-none"
                    rows={[{
                      labels: ['세이브', '실점', '클린시트', 'PK선방'],
                      values: [stat.goals.saves || 0, stat.goals.conceded || 0, stat.goals.cleansheets || 0, stat.penalty.saved || 0],
                    }]}
                  />
                )}
                <StatCard
                  title="기타 통계"
                  className="border-t-0 md:rounded-t-none"
                  rows={[
                    {
                      labels: ['경고', '누적퇴장', '퇴장', '드리블'],
                      values: [
                        displayValue(stat.cards.yellow),
                        displayValue(stat.cards.yellowred),
                        displayValue(stat.cards.red),
                        `${stat.dribbles.success || 0}/${stat.dribbles.attempts || 0}`,
                      ],
                    },
                    {
                      labels: ['파울', '교체투입', '교체아웃', '벤치'],
                      values: [
                        `${stat.fouls.drawn || 0}/${stat.fouls.committed || 0}`,
                        displayValue(stat.substitutes.in),
                        displayValue(stat.substitutes.out),
                        displayValue(stat.substitutes.bench),
                      ],
                    },
                    {
                      labels: ['PK획득', 'PK허용', 'PK득점', 'PK실패'],
                      values: [
                        displayValue(stat.penalty.won),
                        displayValue(stat.penalty.commited),
                        displayValue(stat.penalty.scored),
                        displayValue(stat.penalty.missed),
                      ],
                    },
                  ]}
                />
            </>
          </div>
        );
      })}
    </div>
  );
}

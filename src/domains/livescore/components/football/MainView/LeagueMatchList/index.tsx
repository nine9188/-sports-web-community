'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '@/shared/components/AdBanner';
import { Button, Container, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Match } from '@/domains/livescore/types/match';
import MatchCard from '../MatchCard';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

const PRIORITY_LEAGUE_ORDER = [
  // 1. 주요 컵 대회 및 친선 경기 (사용자 지정 순서)
  1,   // FIFA World Cup
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  848, // UEFA Conference League
  17,  // AFC Champions League
  45,  // FA Cup
  48,  // EFL Cup
  667, // Club Friendlies

  // 2. 주요 정규 리그 (EPL, 라리가 등 지정 순서)
  39,  // 프리미어 리그
  140, // 라리가
  78,  // 분데스리가
  61,  // 리그앙
  135, // 세리에 A
  40,  // 챔피언십
  179, // 스코틀랜드 프리미어십
  88,  // 에레디비지에
  94,  // 프리메이라 리가
  292, // K리그1
  293, // K리그2
  98,  // J1 리그
  169, // 중국 슈퍼리그
  307, // 사우디 프로리그
  253, // MLS
  71,  // 브라질레이로
  262, // 리가 MX
  119, // 덴마크 수페르리가
];

interface LeagueMatchListProps {
  matches: Match[];
  allExpanded?: boolean;
}

interface LeagueGroup {
  name: string;
  matches: Match[];
  leagueId: number;
  logo: string;
  logoDark: string;
}

export default function LeagueMatchList({
  matches,
  allExpanded = true,
}: LeagueMatchListProps) {
  const leagueGroups = useMemo(() => {
    const groups: LeagueGroup[] = [];

    matches.forEach((match) => {
      const existingGroup = groups.find(group => group.leagueId === match.league.id);

      if (existingGroup) {
        existingGroup.matches.push(match);
        return;
      }

      groups.push({
        name: match.league.name,
        matches: [match],
        leagueId: match.league.id,
        logo: match.league.logo || LEAGUE_PLACEHOLDER,
        logoDark: match.league.logoDark || '',
      });
    });

    // 지정된 우선순위에 따라 리그 정렬 (Stable Sort 보장)
    const groupsWithIndex = groups.map((group, idx) => ({ group, idx }));
    groupsWithIndex.sort((a, b) => {
      const indexA = PRIORITY_LEAGUE_ORDER.indexOf(a.group.leagueId);
      const indexB = PRIORITY_LEAGUE_ORDER.indexOf(b.group.leagueId);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.idx - b.idx;
    });

    return groupsWithIndex.map(item => item.group);
  }, [matches]);

  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(() => (
    new Set(leagueGroups.map(group => group.leagueId))
  ));

  useEffect(() => {
    setExpandedLeagues(
      allExpanded ? new Set(leagueGroups.map(group => group.leagueId)) : new Set()
    );
  }, [allExpanded, leagueGroups]);

  const toggleLeague = (leagueId: number) => {
    setExpandedLeagues((prev) => {
      const next = new Set(prev);

      if (next.has(leagueId)) {
        next.delete(leagueId);
      } else {
        next.add(leagueId);
      }

      return next;
    });
  };

  if (matches.length === 0) {
    return (
      <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="px-3 py-4 text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            경기 일정이 없습니다.
          </p>
        </ContainerContent>
      </Container>
    );
  }

  return (
    <div className="space-y-4">
      {leagueGroups.map((group, groupIndex) => {
        const isExpanded = expandedLeagues.has(group.leagueId);

        return (
          <Fragment key={group.leagueId}>
            {groupIndex === 0 && <AdBanner />}
            <Container className="bg-white dark:bg-[#1D1D1D]">
              <Button
                variant="header"
                onClick={() => toggleLeague(group.leagueId)}
                className="w-full h-12 px-4 flex items-center justify-between rounded-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UnifiedSportsImageClient
                    src={group.logo}
                    srcDark={group.logoDark || undefined}
                    alt={group.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <h2 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0] truncate">
                    {group.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">
                    {group.matches.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </Button>

              <div className={`bg-white dark:bg-[#1D1D1D] ${isExpanded ? '' : 'hidden'}`}>
                {group.matches.map((match, idx) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isLast={idx === group.matches.length - 1}
                  />
                ))}
              </div>
            </Container>
          </Fragment>
        );
      })}
    </div>
  );
}

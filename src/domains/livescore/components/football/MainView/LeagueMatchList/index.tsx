'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '@/shared/components/AdBanner';
import { Button, Container, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Match } from '@/domains/livescore/types/match';
import MatchCard from '../MatchCard';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

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

    return groups;
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

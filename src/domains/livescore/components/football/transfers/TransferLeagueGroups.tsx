'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Container, ContainerHeader } from '@/shared/components/ui';
import { getTransferTeamHref } from '@/domains/livescore/utils/entityLinks';
import type { TransferLeagueTeamGroup } from '@/domains/livescore/actions/transfers/transferTeams';

interface TransferLeagueGroupsProps {
  groupedTeams: TransferLeagueTeamGroup[];
}

export default function TransferLeagueGroups({ groupedTeams }: TransferLeagueGroupsProps) {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    () => new Set(groupedTeams.slice(0, 1).map((group) => group.league.id))
  );

  useEffect(() => {
    setExpandedLeagues(new Set(groupedTeams.slice(0, 1).map((group) => group.league.id)));
  }, [groupedTeams]);

  const toggleLeague = (leagueId: number) => {
    setExpandedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId);
      else next.add(leagueId);
      return next;
    });
  };

  const expandAll = () => setExpandedLeagues(new Set(groupedTeams.map((group) => group.league.id)));
  const collapseAll = () => setExpandedLeagues(new Set());

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={expandAll} className="h-8 px-2 text-xs">
          전체 열기
        </Button>
        <Button type="button" variant="ghost" onClick={collapseAll} className="h-8 px-2 text-xs">
          전체 닫기
        </Button>
      </div>

      {groupedTeams.map(({ league, teams: leagueTeams }) => {
        if (!league) return null;

        const isExpanded = expandedLeagues.has(league.id);

        return (
          <Container key={league.id}>
            <ContainerHeader className="px-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleLeague(league.id)}
                className="h-12 w-full justify-between rounded-none px-4"
                aria-expanded={isExpanded}
                aria-controls={`transfer-league-${league.id}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
                    {league.name_ko || league.name}
                  </span>
                  <span className="shrink-0 rounded bg-[#F5F5F5] px-2 py-1 text-xs text-gray-700 dark:bg-[#262626] dark:text-gray-300">
                    {leagueTeams.length}팀
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="hidden sm:inline">{isExpanded ? '접기' : '펼치기'}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </Button>
            </ContainerHeader>

            <div
              id={`transfer-league-${league.id}`}
              className={`bg-white p-3 dark:bg-[#1D1D1D] ${isExpanded ? '' : 'hidden'}`}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {leagueTeams.map((team) => (
                  <Link
                    key={team.id}
                    href={getTransferTeamHref(team)}
                    className="flex items-center justify-between gap-2 rounded border border-black/5 px-3 py-2 text-[13px] text-gray-900 transition-colors hover:bg-[#F5F5F5] dark:border-white/10 dark:text-[#F0F0F0] dark:hover:bg-[#262626]"
                    prefetch={false}
                  >
                    <span className="truncate">{team.name_ko || team.name_en}</span>
                    <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">이적시장</span>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        );
      })}
    </div>
  );
}
